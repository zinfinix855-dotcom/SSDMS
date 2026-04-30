# Base image
FROM node:24-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm install --omit=dev

# Bundle app source
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "server.js"]
