import * as fs from "fs";
import * as path from "path";
import { Downloader } from "./downloader";
import { Parser } from "./parser";
import { CrawlerConfig, CarListing } from "./types";

export class Crawler {
	private config: CrawlerConfig;
	private downloader: Downloader;
	private parser: Parser;
	private visitedUrls: Set<string> = new Set();
	private visitedReferences: Set<string> = new Set();
	private urlQueue: CarListing[] = [];
	private savedCount: number = 0;
	private listingPageCount: number = 0;

	constructor(config: CrawlerConfig) {
		this.config = config;
		this.downloader = new Downloader(config.proxyUrl);
		this.parser = new Parser();
	}

	async crawl(): Promise<void> {
		console.log("\n🚀 [Crawler] Starting crawl session");
		console.log(`   Target: ${this.config.maxPages} detail pages`);
		console.log(`   Base URL: ${this.config.baseUrl}`);
		console.log(`   Page Size: ${this.config.pageSize} results per page\n`);

		// Initialize Playwright browser
		await this.downloader.initialize();

		// Ensure output directory exists
		if (!fs.existsSync(this.config.outputDir)) {
			fs.mkdirSync(this.config.outputDir, { recursive: true });
			console.log(
				`[Crawler] 📁 Created output directory: ${this.config.outputDir}`,
			);
		}

		try {
			// Start with the first listing page
			let currentListingUrl = this.config.baseUrl;

			while (this.savedCount < this.config.maxPages && currentListingUrl) {
				try {
					this.listingPageCount++;
					console.log(
						`\n📄 [Crawler] Processing listing page #${this.listingPageCount}`,
					);
					console.log(`   URL: ${currentListingUrl}`);
					console.log(
						`   Progress: ${this.savedCount}/${this.config.maxPages} detail pages saved\n`,
					);

					// Download listing page
					const listingResult =
						await this.downloader.download(currentListingUrl);

					// Extract car links from HTML
					const newCars = this.parser.extractCarLinks(
						listingResult.html,
						this.config.baseUrl,
					);

					// Add new cars to queue (avoiding duplicates)
					for (const car of newCars) {
						if (!this.visitedReferences.has(car.publicReference)) {
							this.urlQueue.push(car);
							this.visitedReferences.add(car.publicReference);
						}
					}

					console.log(
						`[Crawler] 📦 Queue size: ${this.urlQueue.length} cars pending`,
					);

					// Process cars from queue until we have enough or queue is empty
					while (
						this.urlQueue.length > 0 &&
						this.savedCount < this.config.maxPages
					) {
						const car = this.urlQueue.shift()!;

						if (this.visitedUrls.has(car.url)) {
							continue;
						}

						this.visitedUrls.add(car.url);

						try {
							console.log(
								`[Crawler] 🔍 Fetching: ${car.make}/${car.model}/${car.publicReference}`,
							);

							const result = await this.downloader.download(car.url);
							await this.savePage(result, car);
							this.savedCount++;

							// Rate limiting between detail pages
							await this.sleep(this.config.delayMs);
						} catch (error: unknown) {
							const message =
								error instanceof Error ? error.message : String(error);
							console.error(
								`[Crawler] ❌ Error fetching ${car.url}: ${message}`,
							);
						}
					}

					// Get pagination info to find next listing page
					const pagination = this.parser.extractPagination(
						listingResult.html,
						this.config.baseUrl,
					);
					console.log("🚀🚀🚀 ~ Crawler ~ crawl ~ pagination:", pagination);
					console.log(
						`[Crawler] 📑 Pagination: Page ${pagination.currentPage}`,
					);

					if (pagination.nextPage && this.savedCount < this.config.maxPages) {
						currentListingUrl = pagination.nextPage;
						console.log(
							"🚀🚀🚀 ~ Crawler ~ crawl ~ currentListingUrl:",
							currentListingUrl,
						);
						// Rate limiting between listing pages
						await this.sleep(this.config.delayMs * 2);
					} else {
						console.log("[Crawler] ⏹️  No more listing pages or target reached");
						break;
					}
				} catch (error: unknown) {
					const message =
						error instanceof Error ? error.message : String(error);
					console.error(
						`[Crawler] ❌ Error processing listing page: ${message}`,
					);
					break;
				}
			}

			console.log(`\n✅ [Crawler] Completed!`);
			console.log(`   Total detail pages saved: ${this.savedCount}`);
			console.log(`   Listing pages processed: ${this.listingPageCount}`);
			console.log(`   Output directory: ${this.config.outputDir}\n`);
		} finally {
			await this.downloader.close();
		}
	}

	private async savePage(
		result: { url: string; html: string; timestamp: Date },
		car: CarListing,
	): Promise<void> {
		// Create a descriptive filename
		const filename = `page_${String(this.savedCount + 1).padStart(3, "0")}_${car.make}_${car.model}_${car.publicReference}.html`;
		const filepath = path.join(this.config.outputDir, filename);

		fs.writeFileSync(filepath, result.html, "utf-8");
		console.log(`[Crawler] 💾 Saved: ${filename}`);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
