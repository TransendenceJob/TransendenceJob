# ---------- development ----------
FROM nginx:1.27-alpine AS development
WORKDIR /usr/share/nginx/html

COPY ./assets ./assets

ENV NODE_ENV=development

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# ---------- production ----------
FROM nginx:1.27-alpine AS production
WORKDIR /usr/share/nginx/html

COPY ./assets ./assets

ENV NODE_ENV=production

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]