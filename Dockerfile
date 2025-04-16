# Use Node.js LTS version
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application files
COPY . .

# Install PostgreSQL client (for database initialization)
RUN apk add --no-cache postgresql-client

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"] 