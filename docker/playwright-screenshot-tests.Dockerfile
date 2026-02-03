# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.58.1-jammy@sha256:1b52a0833ae13c3bb16f728eec5f9216db29f3cd5eec21a9cbd33e7623723c0e

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
