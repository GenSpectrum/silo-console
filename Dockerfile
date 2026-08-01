# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Console and exercise targets are configurable at build time.
ARG VITE_RHYDB_DEFAULT_SERVER=https://gs-staging-1.int.genspectrum.org/open/v2/silo
ARG VITE_RHYDB_EXERCISE_SERVER=https://gs-staging-1.int.genspectrum.org/open/v2/silo
ARG VITE_RHYDB_WASM_ENABLED=false
ENV VITE_RHYDB_DEFAULT_SERVER=$VITE_RHYDB_DEFAULT_SERVER
ENV VITE_RHYDB_EXERCISE_SERVER=$VITE_RHYDB_EXERCISE_SERVER
ENV VITE_RHYDB_WASM_ENABLED=$VITE_RHYDB_WASM_ENABLED
RUN npm run build

# --- Serve stage ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 5001
