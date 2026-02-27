# ============================================
# Stage 1: Build Stage
# ============================================
FROM node:22-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install all dependencies (including dev dependencies for build)
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# ============================================
# Stage 2: Production Stage
# ============================================
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /app

# Install pnpm in production image
RUN npm install -g pnpm

# Copy package files and install production dependencies only
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --prod --frozen-lockfile || pnpm install --prod

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Create output directory
RUN mkdir -p /app/output

# ============================================
# Environment Variables (can be overridden at runtime)
# ============================================
ENV START_URL=https://www.carzone.ie/search?size=30
ENV MAX_PAGES=200
ENV OUTPUT_DIR=/app/output
ENV CRAWL_DELAY=1000
ENV PAGE_SIZE=30



# ============================================
# Run the crawler when container starts
# ============================================
CMD ["node", "dist/index.js"]