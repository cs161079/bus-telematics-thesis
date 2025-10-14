FROM nginx:alpine
COPY /dist/admin-bus/browser /usr/share/nginx/html
COPY ./nginx.conf /etc/nginx/conf.d/default.conf
