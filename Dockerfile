# Use an official Node.js runtime as a parent image
FROM node:20-slim

# Install required system dependencies
RUN apt-get update && apt-get install -y \
    liblzo2-2 \
    libvorbis0a \
    libvorbisfile3 \
    libvorbisenc2 \
    libogg0 \
    libuchardet0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install -g @nestjs/cli
RUN npm install --only=production

# Copy the rest of the application code
COPY . .

# Copy DePbo tools files to appropriate system directories
COPY linux/bin/* /usr/local/bin/
COPY linux/lib/* /usr/local/lib/

# Set the library path so the system can find the DePbo shared libraries
ENV LD_LIBRARY_PATH="/usr/local/lib"

# Ensure binaries are executable
RUN chmod +x /usr/local/bin/*

# Build the NestJS application
RUN npm run build

# Expose the application port
EXPOSE 3000

# Command to run the application
CMD ["node", "dist/main"]
