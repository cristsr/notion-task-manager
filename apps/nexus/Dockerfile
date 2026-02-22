# Build stage
FROM node:20-alpine AS builder

WORKDIR /workspace
COPY package.json package-lock.json ./
COPY apps/notifier ./apps/notifier
COPY nx.json tsconfig.base.json ./

RUN npm ci

# Build the application
RUN npm run nx build notifier --configuration=production

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Copy built application from builder
COPY --from=builder /workspace/dist/apps/notifier ./

# Install only production dependencies
RUN npm ci --omit=dev

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001 && \
    chown -R nestjs:nodejs /app

USER nestjs

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "main.js"]
