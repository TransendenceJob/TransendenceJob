# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ---------- development ----------
FROM node:20-alpine AS development
WORKDIR /app

ENV NODE_ENV=development
ENV PORT=3000

COPY package*.json ./
RUN npm ci
COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "-H", "0.0.0.0", "-p", "3000"]

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

ENV NODE_ENV=production

COPY --from=deps /app/node_modules ./node_modules

# COPY THE SHARED FILES HERE:
# This pulls from the "shared_logic" name defined in your YAML
COPY --from=shared . ./shared

COPY . .

RUN npm run build

# ---------- production ----------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "start"]