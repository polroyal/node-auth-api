FROM node:19

# we create app dir inside the image
WORKDIR /usr/src/app

# we install app dependencies inside the image
COPY package*.json ./

RUN npm install 

# we bundle app sorce code inside the image
COPY . .

EXPOSE 8080

CMD [ "node", "index.js" ]


