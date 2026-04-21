# Use the official Playwright image (browsers pre-installed)
FROM mcr.microsoft.com/playwright:v1.59.1-jammy

# Set the working directory
WORKDIR /app

# Configurable port (default 9323 for UI mode & HTML report)
ARG DEFAULT_PORT=9323
ENV PLAYWRIGHT_PORT=${DEFAULT_PORT}

# Copy ONLY package files first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies — prefer ci (strict), fall back to install if lockfile is missing/out-of-sync
RUN npm ci || npm install

# Expose the port for Playwright's UI mode and HTML report server
EXPOSE ${PLAYWRIGHT_PORT}

# Default command (overridden by the shell script)
CMD ["npx", "playwright", "test"]
