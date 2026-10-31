FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package definitions and npm configuration
COPY package*.json .npmrc ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Create uploads directory for storing user documents
RUN mkdir -p /app/uploads

# Copy application source code
COPY index.js ./
COPY src/ ./src/
COPY public/ ./public/

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose backend port
EXPOSE 5000

# Health check to verify service availability
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the Node.js server
CMD ["node", "index.js"]

