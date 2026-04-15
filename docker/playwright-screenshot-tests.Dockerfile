# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.59.1-jammy@sha256:8a0360d39d1973be506dd59002904a774f6d697d4946c94063b3fd006461c8ff

# Set the working directory
WORKDIR /app

# Copy ONLY package files to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install all dependencies from the lock file
RUN npm install

# Install Playwright browsers and their dependencies
RUN npx playwright install --with-deps chromium

# Expose the port for Playwright's UI mode
EXPOSE 9323

# Set a default command (which will be overridden by the script)
CMD ["npx", "playwright", "test"]
