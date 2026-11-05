# Synshift360 - 360 feedback platform
# Build stage: compile client (vite -> dist/public) and server (esbuild -> dist/index.js)
FROM node:20 AS builder
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Runtime stage: production deps + bundled output
FROM node:20
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

# Copy production dependencies and built artifacts
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Runtime config is supplied via env (DATABASE_URL, JWT_SECRET, etc.)
EXPOSE 5000
CMD ["node", "dist/index.js"]
