# Use the official Playwright image
FROM mcr.microsoft.com/playwright:v1.51.1-jammy@sha256:79da45705a7c3f147c435ac6d0beeddf2e132f53263cb27bed90beafbb2e552b

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
