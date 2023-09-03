# Stage 1
FROM node:latest

WORKDIR /app

# COPY package*.json .
# RUN npm install
# COPY . .
# RUN npm run build

# # Stage 2
# FROM nginx:1.19.0
# WORKDIR /usr/share/nginx/html
# RUN rm -rf ./*
# COPY --from=builder /app/build .

# # Port number to expose the Node.js app outside of Docker
# EXPOSE 8000:8000

# # Command to run the application
# #CMD ["node", "index.js"]

# # ENTRYPOINT [ "nginx", "-g", "daemon off;" ]

# # from https://www.bogotobogo.com/DevOps/Docker/Docker-React-App.php
# CMD ["npm", "start"]


# add `/app/node_modules/.bin` to $PATH
ENV PATH /app/node_modules/.bin:$PATH

# install app dependencies
COPY package.json ./
COPY package-lock.json ./
RUN npm install

# add app
COPY . ./

EXPOSE 3000:3000

# start app
CMD ["npm", "start"]