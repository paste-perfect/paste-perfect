# Use the official Playwright image (browsers pre-installed)
FROM mcr.microsoft.com/playwright:v1.59.1-jammy@sha256:8a0360d39d1973be506dd59002904a774f6d697d4946c94063b3fd006461c8ff

# Set the working directory
WORKDIR /app

# Configurable port (default 9323 for UI mode & HTML report)
ARG DEFAULT_PORT=9323
ENV PLAYWRIGHT_PORT=${DEFAULT_PORT}

# Copy ONLY package files first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies strictly from the lockfile
RUN npm ci

# Expose the port for Playwright's UI mode and HTML report server
EXPOSE ${PLAYWRIGHT_PORT}

# Default command (overridden by the shell script)
CMD ["npx", "playwright", "test"]
