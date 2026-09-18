# Connect — Registration interface

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

A web interface for joining an event, sharing invitations, and tracking referrals.

[Run the complete project](../RUNNING_THE_PROJECT.md) · [Backend documentation](../README.md)

## Description

The frontend simplifies the participant journey: registration with a name and email address, access to a personal invitation link, and results displayed in a dashboard. The interface is responsive, is written in Portuguese, and displays data returned by the API.

On the home page (`/`), the form validates fields and captures the `?referrer=ID` parameter when present. After registering, the participant reaches `/inscricao/:id`, where they can copy their invitation, check visits, referred registrations, and their position, and view the top three participants.

Shared links go through `/invites/:id` in the API to record the visit before redirecting to registration. The refresh button fetches metrics again. When network requests fail, the interface displays a message and lets the user retry.

Using an email address that is already registered retrieves the existing registration. The project has no login or authentication, and the frontend does not save names or email addresses in browser storage.

## Project status

In development, with registration, sharing, and tracking integrated with the API.

## Technologies used

- Angular 21 and TypeScript.
- Angular Router, HttpClient, and reactive forms.
- Signals and RxJS for state and requests.
- HTML and CSS for the responsive layout.
- Vitest and Angular testing tools.

## Installation

For interface development only, use Node.js 22.12 or later within the 22.x release line, and npm. The API must be available for registrations and metrics; its setup is covered in the [complete project guide](../RUNNING_THE_PROJECT.md).

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript/frontend
npm ci
npm start
```

If you have already cloned the repository, enter `frontend/` and run only the two npm commands. Open `http://localhost:4200`.

The [proxy.conf.json](proxy.conf.json) file forwards `/subscriptions`, `/subscribers/**`, `/ranking`, and `/invites/**` to `http://127.0.0.1:3333` during development. Adjust the target if your API uses a different address.

## Usage

1. Enter a name and email address, then confirm registration.
2. Copy the personal link displayed in the dashboard and share it.
3. Check visits, referred registrations, and your leaderboard position.
4. Select **Atualizar resultados** (Refresh results) to fetch the latest metrics.

The main interface files are:

| File | Responsibility |
| --- | --- |
| `src/app/registration.ts` | Form, validation, and referral capture |
| `src/app/dashboard.ts` | Invitation, metrics, and leaderboard |
| `src/app/api.ts` | HTTP communication with the backend |
| `src/styles.css` | Styles and visual identity |

### Tests and build

From the `frontend/` directory:

```bash
npm test
npm run build
```

Tests check the form and HTTP contracts using mocked responses. The build is written to `dist/connect/browser`.

For deployment, forward API paths to the backend and configure the `index.html` fallback for interface routes, including `/inscricao/:id`. Angular's proxy only runs during development. For an API on a different origin, configure the `API_URL` token in `src/app/api.ts` and rebuild; the backend must allow the origin through CORS and use the public interface address in `WEB_URL`.

## Docker

The frontend has no Dockerfile or documented published image. Running it with the infrastructure services is covered in the [complete guide](../RUNNING_THE_PROJECT.md).

## Contributing

Fork the repository, create a branch, and implement your change. Run `npm test` and `npm run build` in this directory, then open a pull request with a description and verification steps. For visual changes, include screenshots when possible.

## License

The backend declares ISC in its [package.json](../package.json). The frontend does not declare its own license, and the repository does not yet contain a `LICENSE` file.

## Useful links

- [Run the complete project](../RUNNING_THE_PROJECT.md).
- [Backend documentation](../README.md).
- [Local API Swagger UI](http://localhost:3333/docs), available while the backend is running.
- [Repository](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript).
