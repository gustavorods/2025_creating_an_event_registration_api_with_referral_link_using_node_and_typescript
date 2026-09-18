# Cómo ejecutar el proyecto completo

[English](RUNNING_THE_PROJECT.md) · [Português (Brasil)](COMO_RODAR_O_PROJETO_COMPLETO.md) · [Español](RUNNING_THE_PROJECT.es.md)

Esta guía reúne la preparación de PostgreSQL y Redis, la ejecución de la API y el inicio de la interfaz Angular en desarrollo.

[Documentación del backend](README.es.md) · [Documentación del frontend](frontend/README.es.md)

## 1. Requisitos previos

- Git.
- Node.js 22.12 o superior dentro de la rama 22.x, y npm.
- Docker con Docker Compose disponible y el daemon iniciado, o instancias propias de PostgreSQL y Redis.
- Puertos locales libres: `4200` (frontend), `3333` (API), `5432` (PostgreSQL) y `6379` (Redis).

```bash
node --version
npm --version
docker compose version
```

## 2. Obtener el código e instalar las dependencias

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript
npm ci
npm --prefix frontend ci
```

Si ya tienes el repositorio, utiliza tu copia local. Los comandos de esta guía se ejecutan desde la raíz, salvo que se indique lo contrario.

## 3. Configurar el backend

Copia la plantilla si todavía no existe un `.env`:

```bash
cp dotenv.example .env
```

Edita `.env` con la configuración local siguiente. Si el archivo ya existe, conserva los valores que necesites mantener.

```dotenv
PORT=3333
WEB_URL=http://localhost:4200
POSTGRES_URL=postgresql://docker:docker@localhost:5432/connect
REDIS_URL=redis://localhost:6379
```

| Variable | Finalidad |
| --- | --- |
| `PORT` | Puerto HTTP de la API |
| `WEB_URL` | Página de la interfaz a la que redirigen las invitaciones |
| `POSTGRES_URL` | Conexión con la base de datos de inscripciones |
| `REDIS_URL` | Conexión con los contadores y la clasificación |

Estos valores corresponden a los puertos y credenciales definidos en el Compose del repositorio. Para bases de datos propias, ajusta las URL y comprueba que exista la base de datos `connect`. Git ya ignora `.env`.

## 4. Iniciar las bases de datos

```bash
docker compose up -d
docker compose ps
docker compose logs --tail=50 service-pg service-redis
```

Espera a que ambos servicios estén disponibles antes de continuar. Comprueba las conexiones:

```bash
docker compose exec service-pg pg_isready -U docker -d connect
docker compose exec service-redis redis-cli ping
```

PostgreSQL debe indicar que acepta conexiones y Redis debe responder `PONG`. Con instancias propias, omite los comandos Docker y confirma la disponibilidad en las URL de `.env`.

Compose utiliza las imágenes `bitnami/postgresql` y `bitnami/redis` sin etiquetas fijadas. Si la descarga falla porque no están disponibles o tienen restricciones, configura imágenes accesibles y sus variables correspondientes, o utiliza instancias propias. El archivo actual no define volúmenes persistentes explícitamente; no dependas de la recreación de los contenedores para conservar tus datos.

## 5. Aplicar las migraciones

Desde la raíz del repositorio:

```bash
node --env-file=.env node_modules/drizzle-kit/bin.cjs migrate
```

Este comando lee `drizzle.config.ts` y aplica las migraciones versionadas en `src/drizzle/migrations/`, incluida la tabla `subscriptions`. Ejecútalo antes de registrar participantes y de nuevo cuando haya nuevas migraciones.

## 6. Iniciar la API

En una terminal, desde la raíz:

```bash
npm run dev
```

Mantén esta terminal abierta. La documentación interactiva estará en `http://localhost:3333/docs`. Una consulta inicial de la clasificación debería funcionar incluso sin inscripciones:

```bash
curl http://localhost:3333/ranking
```

En un entorno vacío, la respuesta esperada es `{"ranking":[]}`.

## 7. Iniciar el frontend

En otra terminal, desde la raíz:

```bash
npm --prefix frontend start
```

Abre `http://localhost:4200`. El proxy de `frontend/proxy.conf.json` envía las solicitudes de la interfaz a `http://127.0.0.1:3333`.

Si cambias el puerto de la API, ajusta `PORT` y los destinos del proxy. Si cambias la dirección de la interfaz, ajusta `WEB_URL`. Reinicia los servidores después de modificar estos valores.

## 8. Verificar el flujo completo

1. En la interfaz, inscribe a una persona con nombre y correo electrónico.
2. En el panel de confirmación, copia su enlace de invitación y anota las métricas actuales.
3. Abre la invitación en otra ventana. La visita pasa por la API, incrementa el contador y redirige a la página inicial con `?referrer=ID`.
4. Inscribe a otra persona con un correo diferente.
5. Vuelve al panel de la primera persona y pulsa **Atualizar resultados** (Actualizar resultados).
6. Comprueba el aumento de una visita y una inscripción por recomendación. El participante obtiene una posición en la clasificación y aparece entre los tres primeros si su puntuación está entre las tres más altas.

Reutilizar un correo existente recupera la inscripción sin generar otra recomendación. Visitar el enlace sin completar una nueva inscripción aumenta únicamente las visitas. Los clics repetidos también se cuentan; no se eliminan las visitas duplicadas.

## 9. Ejecutar las pruebas y generar las compilaciones

Desde la raíz:

```bash
npm test
npm --prefix frontend test
npm run build
npm --prefix frontend run build
```

Las pruebas del backend utilizan bases de datos simuladas; las del frontend utilizan respuestas HTTP simuladas. No requieren servicios activos. La comprobación manual anterior complementa estas suites con el flujo integrado real.

El backend genera `dist/` y el frontend genera `frontend/dist/connect/browser/`. Las compilaciones no inician los servidores. La publicación requiere configurar el alojamiento de la interfaz, el reenvío de solicitudes a la API, el fallback de las rutas Angular y las variables del entorno de destino.

## 10. Detener el entorno

Usa `Ctrl+C` en las terminales de la API y del frontend. Para detener las bases de datos conservando los contenedores:

```bash
docker compose stop
```

Para reanudar las bases de datos, ejecuta `docker compose start` y vuelve a iniciar la API y el frontend.

## Solución de problemas

| Síntoma | Qué comprobar |
| --- | --- |
| Falla la instalación con npm | Versión de Node y acceso al registro. Si aparece `Cannot read properties of null (reading 'edgesOut')`, prueba `npx --yes npm@11 ci` en la carpeta afectada. |
| Error de validación al iniciar la API | Todas las URL de `.env` deben estar completas y ser válidas; usa `PORT=3333`. |
| Conexión rechazada en las bases de datos | Disponibilidad de los servicios, puertos y URL de `.env`; consulta los registros de Compose. |
| La tabla `subscriptions` no existe | Aplica las migraciones a la misma base de datos configurada para la API. |
| La interfaz abre, pero la inscripción o el panel fallan | Confirma que la API está activa en `3333` y que el proxy apunta a ella. |
| La invitación redirige a una dirección incorrecta | Ajusta `WEB_URL` a la página inicial del frontend y reinicia la API. |
| Puerto en uso | Detén el servicio en conflicto o cambia el puerto y todas las configuraciones correspondientes. |
| Posición vacía y clasificación sin participantes | Las inscripciones nuevas sin recomendaciones aún no tienen puntuación; prueba con otro correo a través de una invitación. |
| Falla la descarga de imágenes Docker | Comprueba el acceso a las imágenes de Compose o configura instancias propias de las bases de datos. |

## Documentación relacionada

- [Backend: arquitectura, endpoints y pruebas](README.es.md).
- [Frontend: interfaz, uso y desarrollo](frontend/README.es.md).
- [Solicitudes HTTP de ejemplo](api.http).
- [Swagger local](http://localhost:3333/docs), con la API en ejecución.
