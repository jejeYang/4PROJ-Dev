FROM node:22-alpine

# Install postgresql-client for psql commands used in server.js
RUN apk add --no-cache postgresql-client

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
