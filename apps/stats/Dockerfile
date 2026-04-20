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
ENV PORT=3000

EXPOSE 3000
EXPOSE 9229


# This is pointless, because the bind mount overwrites the copied file at the start of runtime
# I added this copy command, so the chmod actually works, but this approach to permissions is naive
COPY ./scripts /app/scripts
RUN chmod +x /app/scripts/prismarun.sh

ENTRYPOINT ["sh","/app/scripts/prismarun.sh"]
CMD ["npm", "run", "start:debug"]

# ---------- build ----------
FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV DATABASE_URL=postgresql://placeholder:placeholder@localhost:5436/placeholder?schema=public
RUN npx prisma generate && npm run build

# ---------- production ----------
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
COPY ./scripts ./scripts

EXPOSE 3000

RUN chmod +x /app/scripts/prismarun.sh
ENTRYPOINT ["sh","/app/scripts/prismarun.sh"]
CMD ["node", "dist/src/main.js"]