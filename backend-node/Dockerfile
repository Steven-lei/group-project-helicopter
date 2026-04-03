FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

ENV PORT=3000

EXPOSE $PORT

CMD ["node", "--max-old-space-size=200", "src/app.js"]