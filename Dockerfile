FROM node:16-alpine

RUN npm install -g npm@9
RUN mkdir -p /app
WORKDIR /app

EXPOSE 3000