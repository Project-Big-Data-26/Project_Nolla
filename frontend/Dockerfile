FROM node:22-alpine AS builder

WORKDIR /app

# Binary Cypress tidak dibutuhkan untuk build produksi.
ENV CYPRESS_INSTALL_BINARY=0

COPY package*.json ./

RUN npm ci

COPY . .

# Dibaca saat build (frontend/.env tidak ikut masuk image, lihat .dockerignore).
ARG VITE_API_BASE_URL=http://localhost:5000/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN npm run build


FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]