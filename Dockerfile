# 1단계: 빌드
FROM node:24-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.24.0 --activate
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# 2단계: 정적 서빙
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
