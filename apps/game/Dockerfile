# ---------- deps ----------
FROM node:20-alpine AS deps
WORKDIR /app

COPY package*.json ./
RUN npm ci

# ---------- development ----------
FROM node:20-alpine AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

ENV NODE_ENV=development
ENV PORT=3001
ENV DEBUG_PORT=9231

EXPOSE 3001
EXPOSE 9231

CMD ["npm", "run", "start:debug"]

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

# COPY THE SHARED FILES HERE:
# This pulls from the "shared_logic" name defined in your YAML
COPY --from=shared . ./shared

COPY . .

ENV NODE_ENV=production
RUN npm run build
RUN ls -R /app/dist

# ---------- production ----------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/src/main.js"]