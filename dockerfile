FROM node:18 as builder

# Set the working directory to /app inside the container
WORKDIR /app
# Copy app files
COPY . .
# Install dependencies (npm ci makes sure the exact versions in the lockfile gets installed)
RUN yarn install

ENV NODE_ENV production
# Build the app
RUN yarn build:circledev


# Bundle static assets with nginx
FROM nginx:1.21.0-alpine as production
ENV NODE_ENV production
ENV NODE_OPTIONS "--max_old_space_size=8192"
# Copy built assets from `builder` image
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/build /usr/share/nginx/html
