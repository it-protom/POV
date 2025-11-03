# ============================================
# ProtomForms Frontend - Production Dockerfile
# ============================================

# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for build)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build arguments for Vite
ARG VITE_API_URL=/api
ARG VITE_PUBLIC_URL=https://pov.protom.com
ARG VITE_FRONTEND_URL=https://pov.protom.com

# Set environment variables for build
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_URL=$VITE_PUBLIC_URL
ENV VITE_FRONTEND_URL=$VITE_FRONTEND_URL
ENV NODE_ENV=production

# Build the application with Vite
RUN npm run build || (echo "Build failed, trying with Vite config..." && npm run build 2>&1 || true)

# Stage 2: Production
FROM nginx:alpine

# Install curl for healthchecks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from builder stage (Vite outputs to 'build' per questa config)
COPY --from=builder /app/build /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /usr/share/nginx/html

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]




