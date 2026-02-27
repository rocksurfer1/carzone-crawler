# Carzone.ie Crawler

A web crawler that scrapes car listings from Carzone.ie and saves them as HTML files. Built with Playwright.

## Requirements

- **Node.js** v20+ (for local development)
- **Docker**
- **pnpm** (package manager)

## Quick Start

### Local Development

```bash
# Install dependencies
pnpm install

# Run crawler
pnpm run dev
```

### Docker

```bash
# Build the image
docker build -t carzone-crawler .

# Run without proxy
docker run \
  -e MAX_PAGES=200 \
  -v $(pwd)/output:/app/output \
  carzone-crawler

# Run with proxy
docker run \
  -e MAX_PAGES=200 \
  -e HTTP_PROXY="http://user:pass@proxy-ip:port" \
  -v $(pwd)/output:/app/output \
  carzone-crawler
```

## Configuration

| Environment Variable | Description | Default |
|---------------------|-------------|---------|
| `MAX_PAGES` | Number of detail pages to crawl | `200` |
| `START_URL` | Starting URL for crawl | `https://www.carzone.ie/search?size=30` |
| `OUTPUT_DIR` | Output directory for HTML files | `/output` |
| `CRAWL_DELAY` | Delay between requests (ms) | `1000` |
| `HTTP_PROXY` | Proxy URL for requests | (none) |

## Output

HTML files are saved to the `output/` directory with descriptive filenames:

```
output/
├── page_001_seat_arona_4333741.html
├── page_002_alfa-romeo_giulietta_4283427.html
└── page_003_audi_a1_4347650.html
```