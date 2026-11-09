
# ============================================================
# STAGE 1 - BUILD ANGULAR
# ============================================================

FROM node:22-alpine AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm exec ng build --configuration production

# ============================================================
# STAGE 2 - SERVE ANGULAR WITH NGINX
# ============================================================

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/client-management-ui/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]