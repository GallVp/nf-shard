#!/usr/bin/env bash

set -euo pipefail

bash test/scripts/wf_cypress_e2e.sh \
	|| echo "Cypress E2E workflow exited with an error!"

pkill -f next

grep -q "All specs passed!" cypress.test.log \
	&& echo "Cypress E2E tests passed!" \
	|| (echo "Cypress E2E tests failed!" && exit 1)
