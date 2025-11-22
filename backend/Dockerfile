# Multi-stage build for production optimization
FROM node:20-alpine AS builder
WORKDIR /app

# Install OpenSSL (required for Prisma)
RUN apk add --no-cache openssl

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma

# Install all dependencies (including dev)
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install OpenSSL (required for Prisma runtime)
RUN apk add --no-cache openssl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma

# Install production dependencies
RUN npm ci --omit=dev

# Generate Prisma client for production
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Copy PM2 ecosystem config
COPY ecosystem.config.cjs ./

# Create logs directory for PM2
RUN mkdir -p logs

# Install PM2 globally
RUN npm install -g pm2

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

EXPOSE 3000

# Run migrations and start all services (API + Workers) with PM2
CMD ["sh", "-c", "npx prisma migrate deploy && pm2-runtime start ecosystem.config.cjs"]
