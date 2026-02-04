# ==========================================
# Stage 1: Build shared library
# ==========================================
FROM node:20-alpine AS shared-builder

WORKDIR /app/shared
COPY shared/package*.json ./
RUN npm ci
COPY shared/ ./
RUN npm run build

# ==========================================
# Stage 2: Build server
# ==========================================
FROM node:20-alpine AS server-builder

WORKDIR /app

# Copy shared build
COPY --from=shared-builder /app/shared /app/shared

# Install server dependencies
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci

# Copy server source and build
COPY server/ ./
RUN npm run build

# ==========================================
# Stage 3: Build client
# ==========================================
FROM node:20-alpine AS client-builder

WORKDIR /app

# Copy shared build
COPY --from=shared-builder /app/shared /app/shared

# Install client dependencies
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci

# Copy client source and build
COPY client/ ./
RUN npm run build

# ==========================================
# Stage 4: Production server image
# ==========================================
FROM node:20-alpine AS server

WORKDIR /app

# Copy shared
COPY --from=shared-builder /app/shared/dist /app/shared/dist
COPY --from=shared-builder /app/shared/package.json /app/shared/

# Copy server
COPY --from=server-builder /app/server/dist /app/server/dist
COPY --from=server-builder /app/server/package.json /app/server/
COPY --from=server-builder /app/server/node_modules /app/server/node_modules

WORKDIR /app/server

# Environment
ENV NODE_ENV=production
ENV PORT=2567

EXPOSE 2567

CMD ["node", "dist/index.js"]

# ==========================================
# Stage 5: Production client image (nginx)
# ==========================================
FROM nginx:alpine AS client

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy client build
COPY --from=client-builder /app/client/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
