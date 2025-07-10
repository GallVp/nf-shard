#!/usr/bin/env bash

set -euo pipefail

# Export the project name for docker compose
export COMPOSE_PROJECT_NAME="nf-shard"

# Ensure that docker is installed
if ! command -v docker &> /dev/null; then
	echo "Docker is required to deploy nf-shard locally"
	exit 1
fi

# Ensure that docker compose is installed
if ! docker compose version  &> /dev/null; then
	echo "Docker Compose is required to deploy nf-shard locally"
	exit 1
fi

# Input environment
POSTGRES_PASSWORD=
APP_USERNAME=
APP_PASSWORD=
LOG_LEVEL=INFO

FORCE=0

while getopts "fp:u:s:l:" opt; do
    case ${opt} in
		f )
        FORCE=1
        ;;
    p )
        POSTGRES_PASSWORD="$OPTARG"
        ;;
		u )
        APP_USERNAME="$OPTARG"
        ;;
		s )
        APP_PASSWORD="$OPTARG"
        ;;
		l )
        LOG_LEVEL="$OPTARG"
        ;;
    \? )
        echo "Invalid option" 1>&2
        exit 1
        ;;
    esac
done
shift $((OPTIND -1))

# Check for existing containers and volumes
if [ $FORCE -eq 0 ] && \
		$(docker ps -q --filter "name=nf-shard-nextjs" | grep -q . || \
			docker ps -q --filter "name=nf-shard-postgres" | grep -q . || \
			docker volume ls -q --filter name=nf_shard_postgres_data | grep -q .); then
	
	echo "nf-shard is already deployed. Use -f to force redeployment."
	exit 0
elif [ $FORCE -eq 1 ]; then
	echo "Stopping and removing existing nf-shard containers..."
	
	if docker ps -q --filter "name=nf-shard-nextjs" | grep -q .; then
		docker stop nf-shard-nextjs
		docker rm nf-shard-nextjs
	fi

	if docker ps -q --filter "name=nf-shard-postgres" | grep -q .; then
		docker stop nf-shard-postgres
		docker rm nf-shard-postgres
	fi

	if docker volume ls -q --filter name=nf-shard_postgres-data | grep -q .; then
		docker volume rm nf-shard_postgres-data
	fi
fi

# Check if required environment variables are set
if [ -z "$POSTGRES_PASSWORD" ]; then
	echo "POSTGRES_PASSWORD is required. Use -p to set it."
	exit 1
fi
if [ -z "$APP_USERNAME" ]; then
	echo "APP_USERNAME is required. Use -u to set it."
	exit 1
fi
if [ -z "$APP_PASSWORD" ]; then
	echo "APP_PASSWORD is required. Use -s to set it."
	exit 1
fi

# Setup environment
POSTGRES_URI=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres?schema=public
APP_SECRET_KEY=$(openssl rand -hex 32)
DEFAULT_ACCESS_TOKEN=$(openssl rand -hex 32 | sed -E 's/(.{16})(.{16})(.{16})(.{16})/\1-\2-\3-\4/')

# Run docker compose
docker compose -f - --profile all up --wait <<EOF
services:
  postgres:
    image: postgres
    container_name: nf-shard-postgres
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:?}
    ports:
      - 5435:5432
    volumes:
      - postgres-data:/var/lib/postgresql/data
    profiles:
      - db
      - all
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d postgres"]
      interval: 5s
      timeout: 2s
      retries: 20

  nextjs:
    container_name: nf-shard-nextjs
    image: ghcr.io/gallvp/nf-shard:latest
    platform: linux/amd64
    environment:
      POSTGRES_URI: ${POSTGRES_URI:?}
      APP_SECRET_KEY: ${APP_SECRET_KEY:?}
      DEFAULT_ACCESS_TOKEN: ${DEFAULT_ACCESS_TOKEN}
      APP_USERNAME: ${APP_USERNAME:?}
      APP_PASSWORD: ${APP_PASSWORD:?}
      LOG_LEVEL: ${LOG_LEVEL:-INFO}
    ports:
      - 3000:3000
    profiles:
      - server
      - all
    depends_on:
      postgres:
        condition: service_healthy
    restart: always

volumes:
  postgres-data:
EOF

sleep 20

echo -e "\nnf-shard deployed locally at http://localhost:3000\n"

echo -e "Default workspace config:"
echo -e "tower {\n  enabled = true\n  accessToken = \"${DEFAULT_ACCESS_TOKEN}\"\n  endpoint = \"http://localhost:3000/api\"\n}\n"
echo -e "Keep the secret accessToken safe, it is used to authenticate with the nf-shard server."
