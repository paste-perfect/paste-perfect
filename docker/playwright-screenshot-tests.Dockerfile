# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.55.1-jammy@sha256:a012a91c32e36b3300514684c5bdb60c07f01464abd03380320179e5273427ab

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
