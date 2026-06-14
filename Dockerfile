# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

# Default SILO server, overridable at build time:
#   docker build --build-arg VITE_SILO_DEFAULT_SERVER=https://my-silo/... .
ARG VITE_SILO_DEFAULT_SERVER=https://gs-staging-1.int.genspectrum.org/open/v2/silo
ENV VITE_SILO_DEFAULT_SERVER=$VITE_SILO_DEFAULT_SERVER
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5001
