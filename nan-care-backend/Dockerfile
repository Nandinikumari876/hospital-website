FROM node:20

WORKDIR /app

COPY package*.json ./

# Force fresh dependency installation
   RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]