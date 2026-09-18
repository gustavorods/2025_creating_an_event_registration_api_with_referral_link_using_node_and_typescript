# Running the complete project

[English](RUNNING_THE_PROJECT.md) · [Português (Brasil)](COMO_RODAR_O_PROJETO_COMPLETO.md) · [Español](RUNNING_THE_PROJECT.es.md)

This guide covers PostgreSQL and Redis setup, API execution, and starting the Angular interface for development.

[Backend documentation](README.md) · [Frontend documentation](frontend/README.md)

## 1. Prerequisites

- Git.
- Node.js 22.12 or later within the 22.x release line, and npm.
- Docker with Docker Compose available and the daemon running, or your own PostgreSQL and Redis instances.
- Available local ports: `4200` (frontend), `3333` (API), `5432` (PostgreSQL), and `6379` (Redis).

```bash
node --version
npm --version
docker compose version
```

## 2. Get the code and install dependencies

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript
npm ci
npm --prefix frontend ci
```

If you already have the repository, use your local copy. Commands in this guide run from the repository root unless stated otherwise.

## 3. Configure the backend

Copy the template if `.env` does not exist yet:

```bash
cp dotenv.example .env
```

Edit `.env` with the local settings below. If the file already exists, preserve any values you need to keep.

```dotenv
PORT=3333
WEB_URL=http://localhost:4200
POSTGRES_URL=postgresql://docker:docker@localhost:5432/connect
REDIS_URL=redis://localhost:6379
```

| Variable | Purpose |
| --- | --- |
| `PORT` | API HTTP port |
| `WEB_URL` | Interface page that invitations redirect to |
| `POSTGRES_URL` | Connection to the registration database |
| `REDIS_URL` | Connection to counters and the leaderboard |

These values match the ports and credentials defined in the repository's Compose file. For your own databases, adjust the URLs and make sure the `connect` database exists. Git already ignores `.env`.

## 4. Start the databases

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=50 service-pg service-redis
```

Wait until both services are available before continuing. Check the connections:

```bash
docker compose exec service-pg pg_isready -U docker -d connect
docker compose exec service-redis redis-cli ping
```

PostgreSQL should report that it is accepting connections, and Redis should return `PONG`. For your own instances, skip the Docker commands and confirm availability at the URLs in `.env`.

Compose uses the `bitnami/postgresql` and `bitnami/redis` images without pinned tags. If downloads fail because these images are unavailable or restricted, configure accessible images and their corresponding variables, or use your own instances. The current file does not explicitly define persistent volumes; do not rely on container recreation to preserve your data.

## 5. Apply migrations

From the repository root:

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
```

This command reads `drizzle.config.ts` and applies the versioned migrations in `src/drizzle/migrations/`, including the `subscriptions` table. Run it before registering participants and again whenever new migrations are added.

## 6. Start the API

In a terminal at the repository root:

```bash
npm run dev
```

Keep this terminal open. Interactive documentation will be available at `http://localhost:3333/docs`. An initial leaderboard request should work even without registrations:

```bash
curl http://localhost:3333/ranking
```

In an empty environment, the expected response is `{"ranking":[]}`.

## 7. Start the frontend

In another terminal, at the repository root:

```bash
npm --prefix frontend start
```

Open `http://localhost:4200`. The proxy in `frontend/proxy.conf.json` forwards interface requests to `http://127.0.0.1:3333`.

If you change the API port, update `PORT` and the proxy targets. If you change the interface address, update `WEB_URL`. Restart the servers after changing these settings.

## 8. Verify the complete flow

1. In the interface, register a person with a name and email address.
2. In the confirmation dashboard, copy their invitation link and note the current metrics.
3. Open the invitation in another window. The visit goes through the API, increments the counter, and redirects to the home page with `?referrer=ID`.
4. Register another person with a different email address.
5. Return to the first person's dashboard and select **Atualizar resultados** (Refresh results).
6. Confirm that visits and referred registrations have each increased by one. The participant receives a leaderboard position and appears in the top three if their score is among the three highest.

Reusing an existing email retrieves the registration without creating another referral. Visiting the link without completing a new registration only increases visits. Repeated clicks are also counted; visitors are not deduplicated.

## 9. Run tests and generate builds

From the repository root:

```bash
npm test
npm --prefix frontend test
npm run build
npm --prefix frontend run build
```

Backend tests use mocked databases; frontend tests use mocked HTTP responses. They do not require running services. The manual check above complements these suites with the actual integrated flow.

The backend generates `dist/`, and the frontend generates `frontend/dist/connect/browser/`. Builds do not start the servers. Deployment requires configuring interface hosting, forwarding API calls, Angular route fallbacks, and target environment variables.

## 10. Stop the environment

Use `Ctrl+C` in the API and frontend terminals. To stop the databases while keeping their containers:

```bash
docker compose stop
```

To resume the databases, run `docker compose start`, then start the API and frontend again.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| npm installation fails | Node version and registry access. If you see `Cannot read properties of null (reading 'edgesOut')`, try `npx --yes npm@11 ci` in the affected directory. |
| Validation error when starting the API | All URLs in `.env` must be populated and valid; use `PORT=3333`. |
| Database connection refused | Service availability, ports, and URLs in `.env`; check Compose logs. |
| `subscriptions` table does not exist | Apply migrations to the same database configured for the API. |
| Interface loads but registration or dashboard fails | Confirm the API is running on `3333` and that the proxy points to it. |
| Invitation redirects to the wrong address | Set `WEB_URL` to the frontend home page and restart the API. |
| Port already in use | Stop the conflicting service or change the port and all corresponding settings. |
| Empty position and leaderboard | New registrations without referrals have no score yet; test with another email through an invitation. |
| Docker image download fails | Check access to the images used by Compose or configure your own database instances. |

## Related documentation

- [Backend: architecture, endpoints, and tests](README.md).
- [Frontend: interface, usage, and development](frontend/README.md).
- [Sample HTTP requests](api.http).
- [Local Swagger UI](http://localhost:3333/docs), while the API is running.
