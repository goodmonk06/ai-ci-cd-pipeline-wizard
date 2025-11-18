# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source code
COPY backend ./backend
COPY tsconfig*.json ./

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build:backend

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install production dependencies only
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npm cache clean --force

# Generate Prisma client in production
RUN npx prisma generate

# Copy built application from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S fastify -u 1001

# Create generated directory with proper permissions
RUN mkdir -p /app/generated && chown -R fastify:nodejs /app/generated

USER fastify

EXPOSE 3001

CMD ["node", "dist/backend/server.js"]
