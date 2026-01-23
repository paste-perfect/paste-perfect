# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.58.0-jammy@sha256:16d2851dba57d144f2ee4829b59ecc9fb7475231f435675b007005d0d644bcd7

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
