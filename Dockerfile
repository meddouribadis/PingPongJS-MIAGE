FROM node:latest

WORKDIR /web/app/
COPY package.json /web/app
RUN npm install
COPY . /web/app

RUN npm install -g nodemon
EXPOSE 3010
CMD [ "nodemon", "server.js" ]