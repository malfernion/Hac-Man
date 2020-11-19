# Stage 1 - the build process
FROM node:lts-slim as build-deps

COPY package.json yarn.lock /home/app/
WORKDIR /home/app

RUN yarn install

COPY . /home/app
RUN yarn build

# Stage 2 - the production environment
FROM nginx:1.12-alpine
COPY --from=build-deps /home/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]