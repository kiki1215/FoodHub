# Stage 1: Build SPA bằng Node.js LTS & Vite
FROM node:22-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=http://localhost:8080/api
ARG VITE_GATEWAY_ORIGIN=http://localhost:8080
ARG VITE_APP_TITLE="FOODHUB - Đặt Đồ Ăn Trực Tuyến"

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL} \
    VITE_GATEWAY_ORIGIN=${VITE_GATEWAY_ORIGIN} \
    VITE_APP_TITLE=${VITE_APP_TITLE}

RUN npm run build

# Stage 2: Phục vụ tệp tĩnh bằng Nginx 1.27 Alpine
FROM nginx:1.27-alpine
ENV TZ=Asia/Ho_Chi_Minh

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
