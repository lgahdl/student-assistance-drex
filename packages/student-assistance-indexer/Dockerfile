FROM node:18-alpine

WORKDIR /app

# Install PostgreSQL client (needed for health checks and debugging)
RUN apk add --no-cache postgresql-client

# Copy package files first
COPY package.json ./

# Generate package-lock.json and install dependencies
RUN npm install --package-lock-only
RUN npm ci --omit=dev

# Copy source code (node_modules is excluded by .dockerignore)
COPY . .

# Create logs directory
RUN mkdir -p logs

# Expose Ponder's default port
EXPOSE 42069

# Start the indexer
CMD ["npm", "run", "dev"] 