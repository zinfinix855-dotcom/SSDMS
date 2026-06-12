# Production Backend Dockerfile
FROM node:24-alpine

# Security: Set working directory and non-root user
WORKDIR /app

# Install system dependencies for native modules if needed
RUN apk add --no-cache python3 make g++

# Layer caching: Install dependencies first
COPY package*.json ./
RUN npm install --omit=dev

# Copy source code
COPY . .

# Environment Defaults
ENV NODE_ENV=production
ENV PORT=5000

# Health check to ensure the API is responding
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

EXPOSE 5000

# Entrypoint for database readiness (Optional but recommended in compose)
CMD ["node", "server.js"]
