[![Build](https://github.com/GallVp/nf-shard/actions/workflows/ci.yml/badge.svg)](https://github.com/GallVp/nf-shard/actions/workflows/ci.yml)
![Version badge](https://ghcr-badge.egpl.dev/GallVp/nf-shard/latest_tag?color=%236d52f4&ignore=latest&label=Version&trim=)
![Size badge](https://ghcr-badge.egpl.dev/GallVp/nf-shard/size?color=%23fa0092&tag=latest&label=Image+size&trim=)

![nf-shard Logo](./assets/logo.png)

# nf-shard

nf-shard is an open source user interface for monitoring Nextflow runs, searching historical runs and analysing metrics. It was designed as drop-in replacement for community [nf-tower](https://github.com/seqeralabs/nf-tower), however it does not aim to replace Enterprise nf-tower.

[![Foo](./assets/play.png)](https://www.youtube.com/watch?v=Fzq9cqozwEU)

## Usage in Nextflow

Once nf-shard is running to integrate it into your Nextflow project you should add similar snippet to your `nextflow.config`. The exact form of this snippet will be displayed once you start nf-shard.

```nextflow
tower {
    enabled = true
    accessToken = "non-empty"
    endpoint = "http://localhost:3000/api"
}
```

## Run

Following instructions allows to run `nf-shard` locally. Make sure [`Docker`](https://docs.docker.com/engine/install/) and [`docker-compose`](https://docs.docker.com/compose/install/linux/) are already installed.

### Method 1 - `bash` 1-liner

```bash

```

### Method 2 - docker-compose

```bash
git clone git@github.com:GallVp/nf-shard.git
cd nf-shard
docker-compose --profile all up
```

If you have PostgreSQL running externally then you only need to launch the server. In this case update your `.env` with `POSTGRES_URI` and run

```bash
git clone git@github.com:GallVp/nf-shard.git
cd nf-shard
docker-compose --profile server up
```

Add tower server details in your Nextflow config.

```nextflow
tower {
    enabled = true
    accessToken = "non-empty"
    endpoint = "http://localhost:3000/api"
}
```

Done! If you navigate to `http://localhost:3000` and run Nextflow workflow you should be able to see progress in the UI.

Note - `accessToken` can by any non-empty string.

### Method 3 - yarn

If you already have running PostgreSQL database, you can run build the project using yarn package manager. To specify your database login edit `.env`. If you are developer you would prefer using this approach.

```
yarn
yarn migrate
yarn build
yarn run
```

Not that `yarn migrate` requires connection to the database, so you should update `.env` file.

To run PostgreSQL for local development you can use

```bash
docker-compose --profile db up
```

Since connection to PostgreSQL now happens outside of docker, you should update your `.env` to specify `localhost`

```bash
POSTGRES_URI=postgresql://postgres:postgres@localhost:5432/postgres?schema=public
```

## Stack

- NextJS/React/Typescript
- PostgreSQL
- Prisma ORM

I was picking the a stack with large communities to maximise open source contribution from the Nextflow community.

## Features

- [Slack integration](https://www.youtube.com/watch?v=8lWLgvROQ8Q)
- Indexed search by workflow ID, run name, user name, tag, projeect name, before date, after date.
- Search supports multiple `AND` conditions.
- Ability to attach multiple tags for each workflow. Tags are visible in the UI and can be used in search.
- Workspaces
- List of historical runs
- Run details
- `nf-tower` plugin compatible API.
- Store and submit pipeline jobs from Shard UI (beta requires deploying [shard-worker](https://github.com/AugustDev/shard-worker))

![image](https://github.com/user-attachments/assets/1a2a0aea-2559-4c7a-b8bb-c033da4c2c9b)

## Roadmap

- Authentication
- Dedicated plugin
- Upload/view execution logs
- Download reports
- [tRPC](https://trpc.io/) client/server communication

## Development

Useful during development

```
docker buildx build --platform linux/amd64 -t nf-shard:semver . --load
docker run -it nf-shard:semver /bin/sh
```

## Author

Augustinas Malinauskas
