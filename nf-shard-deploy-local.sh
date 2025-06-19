#!/usr/bin/env bash

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

POSTGRES_PASSWORD=postgres
POSTGRES_URI=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres?schema=public

# Optionally, get the Postgresql password as a command line argument -p
while getopts "p:" opt; do
    case ${opt} in
    p )
        POSTGRES_PASSWORD="$OPTARG"
        ;;
    \? )
        echo "Invalid option" 1>&2
        exit 1
        ;;
    esac
done
shift $((OPTIND -1))

# Run docker compose
docker compose -f - --profile all up <<EOF
version: "3.7"

services:
  postgres:
    image: postgres
    container_name: nf-shard-postgres
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    ports:
      - 5435:5432
    volumes:
      - postgres-data:/var/lib/postgresql/data
    profiles:
      - db
      - all

  nextjs:
    image: ghcr.io/gallvp/nf-shard:latest
    container_name: nf-shard-nextjs
    entrypoint: ["/app/entrypoint.sh"]
    volumes:
      - ./docker/entrypoint.sh:/app/entrypoint.sh
    platform: linux/amd64
    environment:
      POSTGRES_URI: ${POSTGRES_URI}
    ports:
      - 3000:3000
    profiles:
      - server
      - all
    depends_on:
      - postgres

volumes:
  postgres-data:
EOF

