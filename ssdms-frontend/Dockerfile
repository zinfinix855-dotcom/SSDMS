# Phase 1: Build
FROM node:24-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Phase 2: Production
FROM nginx:alpine
COPY --from=build-stage /app/dist /usr/share/nginx/html
# Custom Nginx config to handle React Router 7 SPA routing
RUN echo 'server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html; \
        try_files $uri $uri/ /index.html; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
