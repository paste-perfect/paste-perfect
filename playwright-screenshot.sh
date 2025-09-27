#!/bin/bash
set -e

# Build the Docker image if it doesn't exist
if ! docker image inspect playwright-screenshot-tests >/dev/null 2>&1; then
    echo "Building Playwright Docker image..."
    docker build -f ./docker/playwright-screenshot-tests.Dockerfile -t playwright-screenshot-tests .
fi

# Check if we're in an interactive terminal
if [ -t 0 ]; then
   ARGS="-it"
else
   ARGS=""
fi

# Determine if we need to run in UI mode
UI_ARGS=""
if [[ "$*" == *"--ui"* ]]; then
    UI_ARGS="--ui-host=0.0.0.0 --ui-port=9323"
    ARGS="-it" # UI mode requires an interactive terminal

    # This function waits for the port to be available and then prints the URL.
    # It runs in the background, allowing the docker command to start simultaneously.
    wait_and_print_url() {
        echo "Waiting for Playwright UI to be ready..."
        # Wait for the port to be open. Use a timeout of 30 seconds.
        for _ in {1..30}; do
            if curl -s --head http://localhost:9323 > /dev/null; then
                echo -e "\n\033[1;34mPlaywright UI mode is ready. Open the following URL in your browser:\033[0m"
                echo -e "\033[1;32mhttp://localhost:9323\033[0m\n"
                return
            fi
            sleep 1
        done
        echo "Timed out waiting for Playwright UI on port 9323." >&2
    }

    # Run the wait function in the background
    wait_and_print_url &
fi

# Create directories for reports if they don't exist
mkdir -p reports/playwright

# Run the Playwright tests in a Docker container
# The main script will block here, showing container logs.
# The background function will print the URL when ready.
docker run ${ARGS} --rm \
 -p 9323:9323 \
 -v "$PWD:/app" \
 -v /app/node_modules \
 -w /app \
 -e "CI=${CI}" \
 --add-host=host.docker.internal:host-gateway \
 playwright-screenshot-tests \
 npx playwright "$@" ${UI_ARGS}
