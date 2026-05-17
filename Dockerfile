FROM node:24-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps

COPY server ./server
COPY www ./www

ENV HOST=0.0.0.0
ENV PORT=80

EXPOSE 80

CMD ["node", "server/index.mjs"]
