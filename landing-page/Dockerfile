FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve@14.2.6
COPY --from=builder /app/out ./out
ENV HOST=0.0.0.0
CMD sh -c "serve out -s -l ${PORT:-8080}"
