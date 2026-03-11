# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy project files and build
COPY . .
# We can inject production environment variables here if needed during build
# ENV VITE_API_URL=http://localhost:5000 
RUN npm run build

# Production stage using Nginx
FROM nginx:alpine

# Copy custom Nginx configuration to support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled build output from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
