# Waseet API (Express + Prisma). Runs migrations, ensures admin + geo data, then serves.
FROM node:20-alpine

WORKDIR /app

# prisma engine needs openssl on alpine
RUN apk add --no-cache openssl postgresql-client

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate

ENV NODE_ENV=production
ENV PORT=19000
EXPOSE 19000

CMD ["sh", "docker-entrypoint.sh"]
