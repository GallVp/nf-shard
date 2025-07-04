#!/usr/bin/env bash

set -euo pipefail
trap "kill 0" EXIT

# Setup test env
bash test/scripts/setup_test_env.sh

# Deploy database
yarn dotenv -e .env.test npx prisma migrate deploy

# Run dev server
yarn dotenv -e .env.test yarn next dev --turbo & \
yarn wait-on http:localhost:3000

# Run tests
sleep 3
yarn dotenv -e .env.test yarn cypress run
