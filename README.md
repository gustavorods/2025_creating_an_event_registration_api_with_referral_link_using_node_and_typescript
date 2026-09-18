# Connect — Registration and referral API

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

> **[How does it work? (Overview)](docs/como-funcionam-as-indicacoes/README.md)**
> Explore the referral flow step by step, with an example and links to the code.

An API for registering participants, tracking invitations, and viewing a referral leaderboard.

[Run the complete project](RUNNING_THE_PROJECT.md) · [Frontend documentation](frontend/README.md)

## Description

Connect combines a registration API with a web interface for sharing invitations and tracking their results. The backend accepts a name and email address, returns the participant's identifier, and counts new registrations made through their referral link.

An email address that is already registered returns the existing identifier without creating another registration or awarding points again. Each invitation visit increments a counter; the leaderboard uses referred registrations, not clicks. The system is in development and has no authentication: retrieving a registration by email is not a login mechanism.

## Project architecture

```mermaid
flowchart LR
    Browser[Browser] --> Front[Angular frontend]
    Front -->|HTTP / development proxy| API[Fastify API]
    API -->|Registrations| PG[(PostgreSQL)]
    API -->|Visits and leaderboard| Redis[(Redis)]
    API -->|Invitation: 302 redirect| Browser
```

- `frontend/`: registration, confirmation, sharing, and metrics interface.
- `src/routes/`: HTTP endpoints, validation, and response contracts.
- `src/functions/`: registration and referral business rules.
- `src/drizzle/`: PostgreSQL connection, schema, and migrations.
- `src/redis/`: Redis connection for counters and the leaderboard.
- `tests/`: automated backend tests.

Registrations are stored in the `subscriptions` table with a UUID identifier, name, unique email address, and creation timestamp. Redis stores visits in `referral:access-count` and scores in `referral:ranking`. Operations across the two databases do not form a single transaction.

## Technologies used

| Component | Technologies |
| --- | --- |
| API | Node.js, TypeScript, Fastify 5 |
| Validation and documentation | Zod, Swagger / OpenAPI |
| Persistence | PostgreSQL, Drizzle ORM, postgres.js |
| Counters and leaderboard | Redis, ioredis |
| Development | tsx, tsup, Biome, Drizzle Kit |
| Backend tests | Vitest, with mocked database dependencies |
| Web interface | Angular 21, RxJS, reactive forms, CSS |
| Local infrastructure | Docker Compose for the databases |

Installed versions are pinned by each component's `package-lock.json` file.

## Installation and setup

To start the API, interface, and databases together, follow the [complete guide](RUNNING_THE_PROJECT.md). The steps below are for backend development only, with PostgreSQL and Redis already available.

Use Node.js 22.12 or later within the 22.x release line, and npm.

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript
npm ci
cp dotenv.example .env
```

If `.env` already exists, edit it without overwriting your settings. For the default local services, use:

```dotenv
PORT=3333
WEB_URL=http://localhost:4200
POSTGRES_URL=postgresql://docker:docker@localhost:5432/connect
REDIS_URL=redis://localhost:6379
```

`WEB_URL` is the invitation redirect destination and must point to the registration page. Database URLs must match your instances. Once the databases are available, apply migrations and start the API:

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
npm run dev
```

The API runs at `http://localhost:3333`. Run `npm run build` to generate the build in `dist/`.

## Usage

After starting the API, inspect the contracts and try requests in the [local Swagger UI](http://localhost:3333/docs).

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/subscriptions` | Registers or retrieves a participant by email; returns `201` and `subscriberId` |
| GET | `/invites/:subscriberId` | Counts a visit and redirects to `WEB_URL?referrer=ID` |
| GET | `/subscribers/:subscriberId/ranking/clicks` | Returns `{ "count": number }` for visits |
| GET | `/subscribers/:subscriberId/ranking/count` | Returns `{ "count": number }` for referred registrations |
| GET | `/subscribers/:subscriberId/ranking/position` | Returns `{ "position": number or null }` |
| GET | `/ranking` | Returns `{ "ranking": [...] }` with up to three participants, their names, and scores |

```bash
curl -X POST http://localhost:3333/subscriptions \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Silva","email":"ana@example.com"}'

curl http://localhost:3333/ranking
```

To record a referral, also include `"referrer":"REFERRER_ID"` in the registration body. The [api.http](api.http) file contains more requests; replace sample IDs with those returned by your API. Validation requires a string name and a valid email address; the current backend does not check whether the supplied referrer exists.

## Docker

The repository has no Dockerfile or documented published application image. The [docker-compose.yml](docker-compose.yml) file starts only PostgreSQL and Redis:

```bash
docker compose up -d
```

Start the API and frontend separately with npm. See the [complete guide](RUNNING_THE_PROJECT.md) for the startup sequence and service checks.

## Full documentation

- [Run the complete project](RUNNING_THE_PROJECT.md): setup, execution, verification, and troubleshooting.
- [Frontend](frontend/README.md): interface behavior and development.
- [Local Swagger UI](http://localhost:3333/docs): API contracts while the backend is running.
- [Database schema](src/drizzle/schema/subscriptions.ts) and [migrations](src/drizzle/migrations/).
- [Sample requests](api.http).

## Testing

From the repository root:

```bash
npm test
npm run build
```

Tests in `tests/functions.test.ts` cover new and repeated registrations, referral scores, persistence failures, visits, counters, leaderboard positions, and ordering. PostgreSQL and Redis are mocked; tests require no `.env`, running services, or real data. This suite tests business rules, without validating real database integration or route HTTP contracts. The manual integration procedure is in the [complete guide](RUNNING_THE_PROJECT.md).

## Contributing

Fork the repository, create a branch, implement your change, and run the affected component's tests and build. Open a pull request explaining the problem solved and how to verify the result. Update documentation when changing settings or API contracts.

## License

The backend declares the ISC license in [package.json](package.json). The repository does not yet contain a `LICENSE` file with the license text.

## Useful links

- [Repository and history](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript)
- [Environment configuration](dotenv.example)
- [Migration configuration](drizzle.config.ts)
- [Frontend proxy](frontend/proxy.conf.json)

## Contact

For questions, suggestions, and bug reports, open an [issue in the repository](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript/issues). Project maintainer: [gustavorods](https://github.com/gustavorods).
