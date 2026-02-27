import {
	Browser,
	BrowserContext,
	chromium,
	LaunchOptions,
	Page,
} from "playwright";
import { CrawlResult } from "./types";

export class Downloader {
	private browser: Browser | null = null;
	private context: BrowserContext | null = null;
	private page: Page | null = null;
	private proxyUrl?: string;

	constructor(proxyUrl?: string) {
		this.proxyUrl = proxyUrl;
	}

	async initialize(): Promise<void> {
		const launchOptions: LaunchOptions = {
			headless: true,
			args: [
				"--no-sandbox",
				"--disable-setuid-sandbox",
				"--disable-dev-shm-usage",
				"--disable-accelerated-2d-canvas",
				"--no-first-run",
				"--no-zygote",
				"--disable-gpu",
				"--disable-blink-features=AutomationControlled",
			],
		};

		// Configure proxy if provided
		if (this.proxyUrl) {
			launchOptions.proxy = { server: this.proxyUrl };
			console.log(
				`[Downloader] ✅ Using proxy: ${this.proxyUrl.replace(/:\/\/.*@/, "://***@")}`,
			);
		} else {
			console.log(
				"[Downloader] ⚠️  No proxy configured, using direct connection",
			);
		}

		this.browser = await chromium.launch(launchOptions);

		this.context = await this.browser.newContext({
			viewport: { width: 1920, height: 1080 },
			userAgent:
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
		});

		this.page = await this.context.newPage();

		// Set headers to look more like a real browser
		await this.page.setExtraHTTPHeaders({
			Accept:
				"text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
			"Accept-Language": "en-US,en;q=0.9",
			"Accept-Encoding": "gzip, deflate, br",
			Connection: "keep-alive",
			"Upgrade-Insecure-Requests": "1",
			"Sec-Ch-Ua":
				'"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"',
			"Sec-Ch-Ua-Mobile": "?0",
			"Sec-Ch-Ua-Platform": '"Windows"',
		});

		console.log("[Downloader] ✅ Playwright browser initialized");
	}

	async download(url: string): Promise<CrawlResult> {
		if (!this.page) {
			throw new Error("Browser not initialized. Call initialize() first.");
		}

		try {
			// Add random delay to look more human (1000-3000ms)
			const randomDelay = Math.floor(Math.random() * 2000) + 1000;
			await this.sleep(randomDelay);

			console.log(`[Downloader] 📡 Fetching: ${url}`);

			// Navigate to the page and wait for network to be idle
			const response = await this.page.goto(url, {
				waitUntil: "networkidle",
				timeout: 60000,
			});

			if (!response) {
				throw new Error("No response received");
			}

			const status = response.status();

			if (status === 403) {
				console.error(
					"[Downloader] ❌ Access Forbidden (403) - Site may have bot protection",
				);
				throw new Error(`Access forbidden: ${url}`);
			}

			if (status === 429) {
				console.error("[Downloader] ❌ Rate Limited (429) - Too many requests");
				throw new Error(`Rate limited: ${url}`);
			}

			if (status !== 200) {
				console.error(
					`[Downloader] ❌ HTTP ${status}: ${response.statusText()}`,
				);
				throw new Error(`HTTP ${status}: ${url}`);
			}

			// Get the full HTML content
			const html = await this.page.content();

			console.log(`[Downloader] ✅ Success: ${url} (${html.length} bytes)`);

			return {
				url,
				html,
				timestamp: new Date(),
			};
		} catch (error: unknown) {
			const message = error instanceof Error ? error.message : String(error);
			console.error(`[Downloader] ❌ Error fetching ${url}: ${message}`);
			throw error;
		}
	}

	async close(): Promise<void> {
		if (this.browser) {
			await this.browser.close();
			console.log("[Downloader] ✅ Browser closed");
		}
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
