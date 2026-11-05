#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

git fetch origin
git reset --hard origin/main

# warn about variables in .env.example that are missing from the server .env
missing=$(comm -23 \
  <(grep -oE '^[A-Z_][A-Z0-9_]*' .env.example | sort -u) \
  <(grep -oE '^[A-Z_][A-Z0-9_]*' .env | sort -u) || true)
[ -n "$missing" ] && echo "WARNING: missing in .env:" && echo "$missing"

docker compose up -d --build --remove-orphans
docker image prune -f
docker compose ps