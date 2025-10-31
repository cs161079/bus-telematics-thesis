# Stage 1: Build the Angular app
FROM node:18 AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --include=dev
COPY . .
RUN npx ng build --configuration production --base-href /portal/

# Stage 2: Serve with Nginx
FROM nginx:alpine
COPY --from=build /app/dist/admin-bus/browser/ /usr/share/nginx/html/portal/
COPY nginx.conf /etc/nginx/conf.d/default.conf
