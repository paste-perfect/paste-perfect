# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.56.1-jammy@sha256:d518367161e599b64e4e8b83ff180be45bfe22efb78dde77fc4c2942340fe8ca

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
