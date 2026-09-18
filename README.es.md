# Connect — API de inscripciones y recomendaciones

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

> **[¿Cómo funciona? (Visión general)](docs/como-funcionam-as-indicacoes/README.es.md)**
> Entiende el flujo de recomendaciones paso a paso, con un ejemplo y enlaces al código.

Una API para registrar participantes, seguir invitaciones y consultar una clasificación de recomendaciones.

[Cómo ejecutar el proyecto completo](RUNNING_THE_PROJECT.es.md) · [Documentación del frontend](frontend/README.es.md)

## Descripción

Connect combina una API de inscripciones con una interfaz web para compartir invitaciones y seguir sus resultados. El backend recibe un nombre y un correo electrónico, devuelve el identificador del participante y contabiliza las nuevas inscripciones realizadas a través de su enlace.

Un correo ya registrado devuelve el identificador existente sin crear otra inscripción ni volver a sumar puntos. Cada visita a una invitación incrementa un contador; la clasificación considera las inscripciones por recomendación, no los clics. El sistema está en desarrollo y no tiene autenticación: recuperar una inscripción por correo no equivale a iniciar sesión.

## Arquitectura del proyecto

```mermaid
flowchart LR
    Browser[Navegador] --> Front[Frontend Angular]
    Front -->|HTTP / proxy de desarrollo| API[API Fastify]
    API -->|Inscripciones| PG[(PostgreSQL)]
    API -->|Visitas y clasificación| Redis[(Redis)]
    API -->|Invitación: redirección 302| Browser
```

- `frontend/`: interfaz de inscripción, confirmación, invitaciones y métricas.
- `src/routes/`: endpoints HTTP, validación y contratos de respuesta.
- `src/functions/`: reglas de negocio de inscripciones y recomendaciones.
- `src/drizzle/`: conexión, esquema y migraciones de PostgreSQL.
- `src/redis/`: conexión con Redis para contadores y clasificación.
- `tests/`: pruebas automatizadas del backend.

Las inscripciones se guardan en la tabla `subscriptions`, con identificador UUID, nombre, correo único y fecha de creación. Redis almacena las visitas en `referral:access-count` y las puntuaciones en `referral:ranking`. Las operaciones entre ambas bases de datos no forman una única transacción.

## Tecnologías utilizadas

| Componente | Tecnologías |
| --- | --- |
| API | Node.js, TypeScript, Fastify 5 |
| Validación y documentación | Zod, Swagger / OpenAPI |
| Persistencia | PostgreSQL, Drizzle ORM, postgres.js |
| Contadores y clasificación | Redis, ioredis |
| Desarrollo | tsx, tsup, Biome, Drizzle Kit |
| Pruebas del backend | Vitest, con dependencias de bases de datos simuladas |
| Interfaz web | Angular 21, RxJS, formularios reactivos, CSS |
| Infraestructura local | Docker Compose para las bases de datos |

Las versiones instaladas quedan fijadas en los archivos `package-lock.json` de cada componente.

## Instalación y configuración

Para iniciar la API, la interfaz y las bases de datos juntas, sigue la [guía completa](RUNNING_THE_PROJECT.es.md). Los pasos siguientes son para trabajar únicamente en el backend, con PostgreSQL y Redis ya disponibles.

Utiliza Node.js 22.12 o superior dentro de la rama 22.x, y npm.

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript
npm ci
cp dotenv.example .env
```

Si `.env` ya existe, edítalo sin sobrescribir tu configuración. Para los servicios locales predeterminados, utiliza:

```dotenv
PORT=3333
WEB_URL=http://localhost:4200
POSTGRES_URL=postgresql://docker:docker@localhost:5432/connect
REDIS_URL=redis://localhost:6379
```

`WEB_URL` es el destino de las invitaciones y debe apuntar a la página de inscripción. Las URL de las bases de datos deben coincidir con tus instancias. Con las bases de datos disponibles, aplica las migraciones e inicia la API:

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
npm run dev
```

La API se ejecuta en `http://localhost:3333`. Para generar la compilación, ejecuta `npm run build`; la salida se guarda en `dist/`.

## Uso

Después de iniciar la API, consulta los contratos y prueba las solicitudes en [Swagger local](http://localhost:3333/docs).

| Método | Endpoint | Función |
| --- | --- | --- |
| POST | `/subscriptions` | Inscribe o recupera un participante por correo; devuelve `201` y `subscriberId` |
| GET | `/invites/:subscriberId` | Cuenta una visita y redirige a `WEB_URL?referrer=ID` |
| GET | `/subscribers/:subscriberId/ranking/clicks` | Devuelve `{ "count": número }` con las visitas |
| GET | `/subscribers/:subscriberId/ranking/count` | Devuelve `{ "count": número }` con las inscripciones por recomendación |
| GET | `/subscribers/:subscriberId/ranking/position` | Devuelve `{ "position": número o null }` |
| GET | `/ranking` | Devuelve `{ "ranking": [...] }` con hasta tres participantes, sus nombres y puntuaciones |

```bash
curl -X POST http://localhost:3333/subscriptions \
  -H 'Content-Type: application/json' \
  -d '{"name":"Ana Silva","email":"ana@example.com"}'

curl http://localhost:3333/ranking
```

Para registrar una recomendación, incluye también `"referrer":"ID_DEL_REFERENTE"` en el cuerpo de la inscripción. El archivo [api.http](api.http) contiene más solicitudes; sustituye los identificadores de ejemplo por los devueltos por tu API. La validación exige un nombre de tipo string y un correo válido; el backend actual no comprueba si el referente indicado existe.

## Docker

El repositorio no tiene Dockerfile ni una imagen publicada de la aplicación documentada. El archivo [docker-compose.yml](docker-compose.yml) inicia únicamente PostgreSQL y Redis:

```bash
docker compose up -d
```

La API y el frontend se inician por separado con npm. Consulta la [guía completa](RUNNING_THE_PROJECT.es.md) para conocer la secuencia y las comprobaciones de los servicios.

## Documentación completa

- [Cómo ejecutar el proyecto completo](RUNNING_THE_PROJECT.es.md): configuración, ejecución, verificación y solución de problemas.
- [Frontend](frontend/README.es.md): funcionamiento y desarrollo de la interfaz.
- [Swagger local](http://localhost:3333/docs): contratos de la API con el backend en ejecución.
- [Esquema de la base de datos](src/drizzle/schema/subscriptions.ts) y [migraciones](src/drizzle/migrations/).
- [Solicitudes de ejemplo](api.http).

## Pruebas

Desde la raíz del repositorio:

```bash
npm test
npm run build
```

Las pruebas en `tests/functions.test.ts` verifican inscripciones nuevas y repetidas, puntuación por recomendación, errores de persistencia, visitas, contadores, posiciones y orden de la clasificación. PostgreSQL y Redis se simulan; las pruebas no necesitan `.env`, servicios activos ni datos reales. Esta suite prueba las reglas de negocio, sin validar la integración real con las bases de datos ni los contratos HTTP de las rutas. El procedimiento manual de integración está en la [guía completa](RUNNING_THE_PROJECT.es.md).

## Contribuciones

Haz un fork, crea una rama, implementa el cambio y ejecuta las pruebas y la compilación del componente afectado. Abre un pull request explicando el problema resuelto y cómo verificar el resultado. Actualiza la documentación cuando cambies configuraciones o contratos de la API.

## Licencia

El backend declara la licencia ISC en [package.json](package.json). El repositorio todavía no contiene un archivo `LICENSE` con el texto de la licencia.

## Enlaces útiles

- [Repositorio e historial](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript)
- [Configuración del entorno](dotenv.example)
- [Configuración de migraciones](drizzle.config.ts)
- [Proxy del frontend](frontend/proxy.conf.json)

## Contacto

Para preguntas, sugerencias e informes de errores, abre una [issue en el repositorio](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript/issues). Responsable del proyecto: [gustavorods](https://github.com/gustavorods).
