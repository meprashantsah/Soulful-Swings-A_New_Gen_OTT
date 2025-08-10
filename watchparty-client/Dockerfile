# Use Node.js for building the app
FROM node:22 as builder

# Set working directory
WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the entire project and build
COPY . .
RUN npm run build

# Use Nginx to serve the built app
FROM nginx:alpine

# Copy the build output to Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose the port
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]
