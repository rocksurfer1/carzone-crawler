export interface CrawlerConfig {
	baseUrl: string;
	maxPages: number;
	outputDir: string;
	delayMs: number;
	proxyUrl?: string;
	pageSize: number;
}

export interface CrawlResult {
	url: string;
	html: string;
	timestamp: Date;
}

export interface CarListing {
	publicReference: string;
	make: string;
	model: string;
	url: string;
}
