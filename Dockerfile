FROM node:23-alpine3.21
RUN npm install -g typescript npm
WORKDIR /home/node
COPY ["package.json", "./"]
RUN npm install
COPY . .
EXPOSE 5001
RUN mkdir -p /home/node/logs 
RUN npm run build
CMD NODE_ENV=local node dist/main.js