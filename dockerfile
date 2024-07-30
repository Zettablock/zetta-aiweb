FROM node:20.4.5 as builder

# Set the working directory to /app inside the container
WORKDIR /app
# Copy app files
COPY . .
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN pnpm install pm2@latest -g
RUN pnpm install

ENV NODE_ENV production
# Build the app
RUN pnpm build
# web application access log
RUN mkdir -p /var/log/aiweb
# Start the app
RUN pm2 start yarn --name aiweb --interpreter bash -- start -o /var/log/aiweb/out.log -e /var/log/aiweb/err.log

# Bundle static assets with nginx
FROM nginx:1.21.0-alpine as production
ENV NODE_ENV production
ENV NODE_OPTIONS "--max_old_space_size=8192"
# Copy built assets from `builder` image
COPY nginx.conf /etc/nginx/conf.d/default.conf