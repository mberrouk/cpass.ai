# Build stage - only build the React app
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the app
RUN npm run build

# The dist folder will be available at /app/dist
# Main nginx container will serve these files via volume mount
