FROM node:22-alpine AS base
WORKDIR /app

COPY package*.json ./
RUN npm ci --ignore-scripts && npm cache clean --force

COPY . .

FROM base AS dev
EXPOSE 8081 19000 19001 19002
ENV EXPO_DEVTOOLS_LISTEN_ADDRESS=0.0.0.0
CMD ["npx", "expo", "start", "--tunnel"]

FROM base AS test
RUN npm test

FROM base AS web-build
RUN npx expo export --platform web
FROM nginx:alpine AS web
COPY --from=web-build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
