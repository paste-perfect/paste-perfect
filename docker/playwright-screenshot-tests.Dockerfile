# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.56.0-jammy@sha256:0ff863c1700afc42fb0964275e64e4980d539d999303e37cdacb52e9b73af9e3

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
