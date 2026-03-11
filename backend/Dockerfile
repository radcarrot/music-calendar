FROM node:20-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json ./
RUN npm install

# Copy application source code
COPY . .

# Expose the API port
EXPOSE 5000

# Start the application using the scripts defined in package.json
CMD ["npm", "start"]
