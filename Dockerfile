FROM node:alpine

WORKDIR /app

COPY . .

RUN ["npm","install","--force"]

CMD [ "npm","run","dev" ]