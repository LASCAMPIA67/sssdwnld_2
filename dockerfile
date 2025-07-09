# Dockerfile - CRÉER CE FICHIER (racine)
FROM node:18-alpine

WORKDIR /app

# Install yt-dlp dependencies
RUN apk add --no-cache python3 py3-pip ffmpeg
RUN pip3 install --upgrade yt-dlp

# Copy package files
COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY packages/frontend/package*.json ./packages/frontend/

# Install dependencies
RUN npm ci --only=production

# Copy application
COPY . .

# Build frontend
RUN npm run build

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]