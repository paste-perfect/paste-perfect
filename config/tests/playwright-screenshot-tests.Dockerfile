# Use the official Playwright image (browsers pre-installed)
FROM mcr.microsoft.com/playwright:v1.59.1-jammy@sha256:8a0360d39d1973be506dd59002904a774f6d697d4946c94063b3fd006461c8ff

# Set the working directory
WORKDIR /app

# Copy ONLY package files first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies strictly from the lockfile
RUN npm ci

# Default command (overridden by the shell script)
CMD ["npx", "playwright", "test"]
