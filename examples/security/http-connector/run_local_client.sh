#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${SCRIPT_DIR}"
ENV_FILE="${PROJECT_ROOT}/config/.env.client.local"
ENTRYPOINT="${PROJECT_ROOT}/dist/client.mjs"
# export FAME_CONFIG=${PROJECT_ROOT}/config/math-agent-config.yml

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE}." >&2
  exit 1
fi

if [[ ! -f "${ENTRYPOINT}" ]]; then
  echo "Build artifacts not found at ${ENTRYPOINT}. Run 'npm run build' first." >&2
  exit 1
fi

pushd "${PROJECT_ROOT}" >/dev/null
set -a
source "${ENV_FILE}"
set +a

export NODE_OPTIONS="${NODE_OPTIONS:-} --enable-source-maps"

node "${ENTRYPOINT}"
