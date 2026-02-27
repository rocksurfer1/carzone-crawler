import * as cheerio from "cheerio";
import { CarListing } from "./types";

export class Parser {
	/**
	 * Extract car listing links directly from HTML anchor tags
	 * Pattern: /used-cars/{make}/{model}/fpa/{publicReference}
	 */
	extractCarLinks(html: string, baseUrl: string): CarListing[] {
		const $ = cheerio.load(html);
		const listings: CarListing[] = [];
		const seenRefs = new Set<string>();

		// Find all anchor tags with href containing /used-cars/
		$("a[href]").each((_, element) => {
			const href = $(element).attr("href");
			if (!href) return;

			// Match pattern: /used-cars/{make}/{model}/fpa/{publicReference}
			const fpaMatch = href.match(/\/used-cars\/([^/]+)\/([^/]+)\/fpa\/(\d+)/);

			if (fpaMatch) {
				const [, make, model, publicReference] = fpaMatch;

				// Skip duplicates
				if (seenRefs.has(publicReference)) return;
				seenRefs.add(publicReference);

				// Convert relative URLs to absolute
				const absoluteUrl = href.startsWith("http")
					? href
					: new URL(href, baseUrl).href;

				listings.push({
					publicReference,
					make: make.toLowerCase(),
					model: model.toLowerCase(),
					url: absoluteUrl,
				});
			}
		});

		console.log(
			`[Parser] 📊 Found ${listings.length} unique car listings from HTML`,
		);
		return listings;
	}

	/**
	 * Extract pagination info from listing page
	 */
	extractPagination(
		html: string,
		baseUrl: string,
	): { currentPage: number; totalPages: number; nextPage?: string } {
		const $ = cheerio.load(html);
		let currentPage = 1;
		let totalPages = 1;
		let nextPage: string | undefined;

		// Find current page number
		$(".czds-m-pagination__current").each((_, el) => {
			const text = $(el).text().trim();
			currentPage = parseInt(text, 10) || 1;
		});

		// Find next page button
		const nextBtn = $('button[aria-label="Next page"]');
		if (nextBtn.length && !nextBtn.hasClass("czds-m-pagination__disabled")) {
			const nextPageNum = currentPage + 1;
			nextPage = `${baseUrl.split("&page=")[0]}&page=${nextPageNum}`;
		}

		return { currentPage, totalPages, nextPage };
	}
}
