# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.57.0-jammy@sha256:6aca677c27a967caf7673d108ac67ffaf8fed134f27e17b27a05464ca0ace831

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
