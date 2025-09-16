FROM node:20-alpine 
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

RUN npm install -g tsx

ENV CHOKIDAR_USEPOLLING=true
ENV WATCHPACK_POLLING=true 

COPY . .
CMD ["sh", "-c", "npx prisma migrate deploy  && npm run dev && npm run worker:dev"]
