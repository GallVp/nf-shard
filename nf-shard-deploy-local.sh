#!/usr/bin/env bash

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

POSTGRES_PASSWORD=postgres
POSTGRES_URI=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres?schema=public
FORCE=0

# Optionally, get the Postgresql password as a command line argument -p
while getopts "fp:" opt; do
    case ${opt} in
		f )
        FORCE=1
        ;;
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

# Create entry point
mkdir -p ./docker
cat <<EOF > ./docker/entrypoint.sh
#!/bin/sh

# deploy migrations
npx prisma migrate deploy

# run server
node server.js
EOF

chmod +x ./docker/entrypoint.sh

# Run docker compose
docker compose -f - --profile all up --wait <<EOF
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


sleep 20

echo -e "\nnf-shard deployed locally at http://localhost:3000"
