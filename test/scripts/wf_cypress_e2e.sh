#!/usr/bin/env bash

set -euo pipefail

yarn generate

yarn test:env

yarn test:build

yarn test:db

yarn test:start &
yarn wait-on http://localhost:3000

yarn test:cypress:run \
	&> >(tee cypress.test.log 2>&1)
