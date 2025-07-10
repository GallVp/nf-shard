[![Build](https://github.com/GallVp/nf-shard/actions/workflows/ci.yml/badge.svg)](https://github.com/GallVp/nf-shard/actions/workflows/ci.yml)
![Version badge](https://ghcr-badge.egpl.dev/GallVp/nf-shard/latest_tag?color=%236d52f4&ignore=latest&label=Version&trim=)
![Size badge](https://ghcr-badge.egpl.dev/GallVp/nf-shard/size?color=%23fa0092&tag=latest&label=Image+size&trim=)

![nf-shard Logo](./assets/logo.png)

# nf-shard

nf-shard is an open source user interface for monitoring Nextflow runs, searching historical runs and analysing metrics. It was designed as drop-in replacement for community [nf-tower](https://github.com/seqeralabs/nf-tower), however it does not aim to replace Enterprise nf-tower.

[![Foo](./assets/play.png)](https://www.youtube.com/watch?v=Fzq9cqozwEU)

## Usage in Nextflow

Once nf-shard is running to integrate it into your Nextflow project you should add similar snippet to your `nextflow.config`. The exact form of this snippet will be displayed under `Get Started` once you start nf-shard.

```nextflow
tower {
    enabled = true
    workspaceId = "empty or a number"
    accessToken = "non-empty"
    endpoint = "http://localhost:3000/api"
}
```

## Deployment

Following instructions allows to run `nf-shard` locally. Make sure [`Docker`](https://docs.docker.com/engine/install/) and [`docker-compose`](https://docs.docker.com/compose/install/linux/) are already installed.

### Method 1 - `bash` 1-liner - Local

```bash
curl -s \
    https://raw.githubusercontent.com/GallVp/nf-shard/refs/heads/main/deploy-local.sh \
    | bash -s -- -p <Postgresql password> -u <nf-shard username> -s <nf-shard password>
```

Or, force redeployment,

```bash
curl -s \
    https://raw.githubusercontent.com/GallVp/nf-shard/refs/heads/main/deploy-local.sh \
    | bash -s -- -p <Postgresql password> -u <nf-shard username> -s <nf-shard password> -f
```

### Method 2 - docker-compose

Download the repository,

```bash
git clone git@github.com:GallVp/nf-shard.git
```

Setup an `.env` file,

```bash
cat << EOF > .env
POSTGRES_PASSWORD=
POSTGRES_URI=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/postgres?schema=public
APP_SECRET_KEY=$(openssl rand -hex 32)
DEFAULT_ACCESS_TOKEN=$(openssl rand -hex 32 | sed -E 's/(.{16})(.{16})(.{16})(.{16})/\1-\2-\3-\4/')
APP_USERNAME=
APP_PASSWORD=
LOG_LEVEL=INFO
EOF
```

These secrets are,

- `POSTGRES_PASSWORD`: Password for the Postgresql server. This should be a strong password, preferably, generated with a password generator.
- `POSTGRES_URI`: Connection URI for the postgresql server.
- `APP_SECRET_KEY`: A high entropy secret key used by nf-shard to create signed credentials such as a session token.
- `DEFAULT_ACCESS_TOKEN`: The default `accessToken` for the default workspace within nf-shard. This is optional. If left empty, the default workspace is locked forever. More workspaces can still be created in nf-shard.
- `APP_USERNAME`: Username for logging into nf-shard.
- `APP_PASSWORD`: Password for logging into nf-shard.

Start the containers,

```bash
docker compose --profile all up --detach
```

### Method 3 - AWS

Register a domain name under [Amazon Route 53](https://aws.amazon.com/route53/). For the domain name, get a SSL/TLS certificate from [Amazon Certificate Manager](https://aws.amazon.com/certificate-manager/)

Download the repository and run the deployment script,

```bash
git clone git@github.com:GallVp/nf-shard.git && cd nf-shard

bash deploy-aws.sh \
    -p <Postgresql password> \
    -u <nf-shard username> \
    -s <nf-shard password> \
    -v <VPC Id> \
    -n <Public subnet id in zone 1> \
    -b <Public subnet id in zone 2> \
    -k <Key pair name> \
    -c <ACM certificate ARN> \
    -d <Domain name> \
    -z <Hosted zone Id from Route 53>
```

## Development

Setup the secrets and start the PostgreSQL server,

`Note:` Since connection to PostgreSQL now happens outside of docker, you should update your `.env` to specify `localhost`

```bash
POSTGRES_URI=postgresql://postgres:${POSTGRES_PASSWORD}@localhost:5435/postgres?schema=public
```

```bash
docker compose --profile db up --detach
```

Run the dev server,

```bash
yarn
yarn migrate
yarn dev
```

## Stack

- NextJS/React/Typescript
- PostgreSQL
- Prisma ORM
- Cypress E2E testing

## Contribution Workflow

The contribution workflow is similar to nf-core pipelines. Please fork the repo, make changes and create a PR for review and approval to the `dev` branch. The test workflow is documented in [test/scripts/wf_cypress_e2e.sh](test/scripts/wf_cypress_e2e.sh).

## Features

- `nf-tower` plugin compatible API.
- List of historical runs
- Run details
- Workspaces
- Authentication via workspaces tokens
- Ability to attach multiple tags for each workflow. Tags are visible in the UI and can be used in search. `--tags tag1,tag2...` parameter is used for attaching the tags.
- Indexed search by workflow ID, run name, user name, tag, project name, before date, after date.
- [Slack integration](https://www.youtube.com/watch?v=8lWLgvROQ8Q)

## Roadmap

- Store and submit pipeline jobs from Shard UI -- [shard-worker](https://github.com/AugustDev/shard-worker)
- Dedicated plugin
- Upload/view execution logs
- Download reports
- [tRPC](https://trpc.io/) client/server communication

## Authors

- Augustinas Malinauskas
- Usman Rashid