# Use the official Playwright image (browsers pre-installed)
FROM mcr.microsoft.com/playwright:v1.58.2-jammy@sha256:4698a73749c5848d3f5fcd42a2174d172fcad2b2283e087843b115424303a565

# Set the working directory
WORKDIR /app

# Configurable port (default 9323 for UI mode & HTML report)
ARG DEFAULT_PORT=9323
ENV PLAYWRIGHT_PORT=${DEFAULT_PORT}

# Copy ONLY package files first to leverage Docker layer caching
COPY package.json package-lock.json* ./

# Install dependencies strictly from the lockfile
RUN npm ci

# Ensure the installed Playwright version's browser binaries match exactly
RUN npx playwright install --with-deps chromium

# Expose the port for Playwright's UI mode and HTML report server
EXPOSE ${PLAYWRIGHT_PORT}

# Default command (overridden by the shell script)
CMD ["npx", "playwright", "test"]
