#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../backend"
uv pip compile requirements.in -o requirements.txt --python-version 3.11 "$@"