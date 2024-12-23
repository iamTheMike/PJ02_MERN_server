FROM node:21-alpine
#create app folder
WORKDIR /usr/src/app
# copy package.json to app folder
COPY package.json ./

RUN npm install

# copy ทั้งหมดไปที่ app
COPY . .

EXPOSE 5000

CMD ["npm","start"]