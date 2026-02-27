import * as dotenv from "dotenv";
import { Crawler } from "./crawler";
import { CrawlerConfig } from "./types";

dotenv.config();

// Configuration from environment variables
const config: CrawlerConfig = {
	pageSize: parseInt(process.env.PAGE_SIZE || "30", 10),
	baseUrl: process.env.START_URL || "https://www.carzone.ie/search?size=30",
	maxPages: parseInt(process.env.MAX_PAGES || "200", 10),
	outputDir: process.env.OUTPUT_DIR || "/app/output",
	delayMs: parseInt(process.env.CRAWL_DELAY || "1500", 10),
	proxyUrl: process.env.HTTP_PROXY || process.env.HTTPS_PROXY || undefined,
};

async function main() {
	console.log("=".repeat(60));
	console.log("🚗 Carzone.ie Crawler");
	console.log("=".repeat(60));
	console.log("\n📋 Configuration:");
	console.log(`   Start URL: ${config.baseUrl}`);
	console.log(`   Max Pages: ${config.maxPages}`);
	console.log(`   Output Dir: ${config.outputDir}`);
	console.log(`   Delay: ${config.delayMs}ms`);
	console.log(`   Page Size: ${config.pageSize}`);
	console.log(
		`   Proxy: ${config.proxyUrl ? config.proxyUrl.replace(/:\/\/.*@/, "://***@") : "None"}`,
	);
	console.log("\n" + "=".repeat(60) + "\n");

	try {
		const crawler = new Crawler(config);
		await crawler.crawl();

		console.log("=".repeat(60));
		console.log("✅ Crawler finished successfully");
		console.log("=".repeat(60) + "\n");
	} catch (error: unknown) {
		console.error("=".repeat(60));
		console.error("❌ Crawler failed with error:");
		const message = error instanceof Error ? error.message : String(error);
		console.error(message);
		console.error("=".repeat(60) + "\n");
		process.exit(1);
	}
}

main();
