#!/bin/bash
set -e

# --- Colors for Output ---
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[1;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# --- Configuration ---
PLAYWRIGHT_BASE_URL="${PLAYWRIGHT_BASE_URL:-http://localhost:4200/paste-perfect/}"
REPORT_PORT="${REPORT_PORT:-9324}"
UI_PORT="${UI_PORT:-9323}"
CONFIG_PATH="config/tests/playwright.config.ts"
DOCKERFILE_PATH="config/tests/playwright-screenshot-tests.Dockerfile"

# Generate a hash to auto-rebuild the image when dependencies change
if command -v md5sum >/dev/null 2>&1; then
    LOCK_HASH=$(cat package.json package-lock.json 2>/dev/null | md5sum | awk '{print $1}')
elif command -v md5 >/dev/null 2>&1; then
    LOCK_HASH=$(cat package.json package-lock.json 2>/dev/null | md5)
else
    LOCK_HASH="latest"
fi

CONTAINER_NAME="playwright_runner_$(date +%s)"
IMAGE_NAME="playwright-screenshot-tests:${LOCK_HASH}"

# --- Pre-flight Checks ---
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Error: 'docker' command not found. Please install Docker.${NC}" >&2
    exit 1
fi

if [ ! -f "$CONFIG_PATH" ]; then
    echo -e "${RED}❌ Error: Cannot find $CONFIG_PATH.${NC}" >&2
    echo -e "${YELLOW}   Ensure you are running this script from the project root directory!${NC}" >&2
    exit 1
fi

# --- Argument Parsing ---
PLAYWRIGHT_ARGS=()
UI_ARGS=()
FORCE_REBUILD=false
IS_UI_MODE=false

for arg in "$@"; do
    if [ "$arg" == "--rebuild" ]; then
        FORCE_REBUILD=true
    else
        if [[ "$arg" == *"--ui"* ]]; then
            IS_UI_MODE=true
        fi
        PLAYWRIGHT_ARGS+=("$arg")
    fi
done

# --- Build Image ---
if $FORCE_REBUILD || ! docker image inspect "$IMAGE_NAME" >/dev/null 2>&1; then
    echo -e "${BLUE}🔨 Building Playwright Docker image...${NC}"
    docker build -f "$DOCKERFILE_PATH" -t "$IMAGE_NAME" .
else
    echo -e "${GREEN}✅ Using cached Docker image: ${IMAGE_NAME}${NC}"
fi

# --- TTY Detection ---
if [ -t 0 ]; then
    DOCKER_ARGS=(-it)
else
    DOCKER_ARGS=()
fi

EXIT_CODE=0  # Default in case docker run is interrupted
WAIT_PID=""

# --- Cleanup Logic ---
cleanup() {
    echo -e "\n${YELLOW}🧹 Cleaning up...${NC}"

    if [ -n "$WAIT_PID" ] && kill -0 "$WAIT_PID" 2>/dev/null; then
        kill "$WAIT_PID" 2>/dev/null
    fi

    if docker ps -q --filter "name=$CONTAINER_NAME" | grep -q .; then
        echo -e "${YELLOW}Stopping Docker container...${NC}"
        docker stop "$CONTAINER_NAME" >/dev/null 2>&1
    fi
}

# Clean up and force an exit code of 130 if interrupted
trap 'cleanup; exit 130' INT TERM

# Just clean up on normal script completion
trap 'cleanup' EXIT

# --- UI Mode Handling ---
if $IS_UI_MODE; then
    UI_ARGS=("--ui-host=0.0.0.0" "--ui-port=${UI_PORT}")
    DOCKER_ARGS="-it"

    wait_and_print_url() {
        echo -e "${YELLOW}Waiting for Playwright UI to be ready...${NC}"
        for _ in {1..30}; do
            if curl -s --head "http://localhost:${UI_PORT}" > /dev/null 2>&1; then
                echo -e "\n${BLUE}🌐 Playwright UI is ready:${NC}"
                echo -e "${GREEN}   http://localhost:${UI_PORT}${NC}\n"
                return
            fi
            sleep 1
        done
        echo -e "${RED}❌ Timed out waiting for Playwright UI on port ${UI_PORT}.${NC}" >&2
    }

    wait_and_print_url &
    WAIT_PID=$!
fi

# --- Build IPC flag for CI (Linux only) ---
# --ipc=host bypasses Docker's default 64MB /dev/shm limit to prevent Chromium crashes.
# This works on Linux CI (e.g. GitHub Actions) but not on macOS/Windows Docker Desktop.
if [ "$CI" = "true" ]; then
  IPC_ARG="--ipc=host"
else
  IPC_ARG="--shm-size=2gb"
fi

# --- Run Playwright in Docker ---
echo -e "${BLUE}▶ Starting Playwright container...${NC}"
echo -e "${BLUE}  Base URL: ${PLAYWRIGHT_BASE_URL}${NC}"

# Temporarily disable exit-on-error to capture test exit codes naturally
set +e

docker run "${DOCKER_ARGS[@]}" --rm \
    --init \
    ${IPC_ARG} \
    --name "$CONTAINER_NAME" \
    -p "${UI_PORT}:${UI_PORT}" \
    -p "${REPORT_PORT}:${REPORT_PORT}" \
    -v "$PWD:/app" \
    -v /app/node_modules \
    -w /app \
    -e "CI=${CI}" \
    -e "PLAYWRIGHT_BASE_URL=${PLAYWRIGHT_BASE_URL}" \
    -e "UI_PORT=${UI_PORT}" \
    -e "REPORT_PORT=${REPORT_PORT}" \
    --add-host=host.docker.internal:host-gateway \
    "$IMAGE_NAME" \
    npx playwright "${PLAYWRIGHT_ARGS[@]}" --config="$CONFIG_PATH" "${UI_ARGS[@]}"

EXIT_CODE=$?
set -e

# Suppress Ctrl+C / SIGKILL noise
if [[ "${EXIT_CODE:-0}" -eq 130 ]] || [[ "${EXIT_CODE:-0}" -eq 137 ]]; then
    echo -e "\n${YELLOW}⏹ Tests interrupted by user.${NC}"
    exit 0
fi

exit $EXIT_CODE
