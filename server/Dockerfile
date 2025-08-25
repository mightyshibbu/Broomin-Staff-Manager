# Use Node.js LTS
FROM node:18-alpine

# Install netcat for wait-for-db script
RUN apk add --no-cache netcat-openbsd

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 5000

# Start the server using the wait script
CMD ["node", "wait-for-db.js"]
