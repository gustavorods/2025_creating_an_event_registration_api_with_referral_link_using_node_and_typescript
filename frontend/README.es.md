# Connect — Interfaz de inscripciones

[English](README.md) · [Português (Brasil)](README.pt-BR.md) · [Español](README.es.md)

Una interfaz web para inscribirse en un evento, compartir invitaciones y seguir recomendaciones.

[Cómo ejecutar el proyecto completo](../RUNNING_THE_PROJECT.es.md) · [Documentación del backend](../README.es.md)

## Descripción

El frontend simplifica el recorrido del participante: inscripción con nombre y correo electrónico, acceso al enlace personal de invitación y consulta de resultados en un panel. La interfaz es adaptable a distintos tamaños de pantalla, está en portugués y muestra los datos devueltos por la API.

En la página inicial (`/`), el formulario valida los campos y captura el parámetro `?referrer=ID`, cuando está presente. Tras inscribirse, el participante accede a `/inscricao/:id`, donde puede copiar su invitación, consultar visitas, inscripciones por recomendación y su posición, además de ver los tres primeros de la clasificación.

El enlace compartido pasa por `/invites/:id`, en la API, para registrar la visita antes de redirigir a la inscripción. El botón de actualización vuelve a consultar las métricas. Ante errores de red, la interfaz muestra un mensaje y permite reintentar.

Usar un correo ya registrado recupera la inscripción existente. El proyecto no tiene inicio de sesión ni autenticación, y el frontend no guarda nombres ni correos en el almacenamiento del navegador.

## Estado del proyecto

En desarrollo, con los flujos de inscripción, invitación y seguimiento integrados con la API.

## Tecnologías utilizadas

- Angular 21 y TypeScript.
- Angular Router, HttpClient y formularios reactivos.
- Signals y RxJS para estado y solicitudes.
- HTML y CSS para el diseño adaptable.
- Vitest y herramientas de pruebas de Angular.

## Instalación

Para desarrollar únicamente la interfaz, utiliza Node.js 22.12 o superior dentro de la rama 22.x, y npm. La API debe estar disponible para las inscripciones y métricas; su preparación está en la [guía del proyecto completo](../RUNNING_THE_PROJECT.es.md).

```bash
git clone https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript.git
cd 2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript/frontend
npm ci
npm start
```

Si ya clonaste el repositorio, entra en `frontend/` y ejecuta únicamente los dos comandos npm. Abre `http://localhost:4200`.

El archivo [proxy.conf.json](proxy.conf.json) reenvía `/subscriptions`, `/subscribers/**`, `/ranking` e `/invites/**` a `http://127.0.0.1:3333` durante el desarrollo. Ajusta el destino si tu API utiliza otra dirección.

## Uso

1. Introduce nombre y correo electrónico y confirma la inscripción.
2. Copia el enlace personal que aparece en el panel y compártelo.
3. Consulta las visitas, inscripciones por recomendación y posición en la clasificación.
4. Pulsa **Atualizar resultados** (Actualizar resultados) para obtener las métricas más recientes.

Los principales archivos de la interfaz son:

| Archivo | Responsabilidad |
| --- | --- |
| `src/app/registration.ts` | Formulario, validación y captura de recomendaciones |
| `src/app/dashboard.ts` | Invitación, métricas y clasificación |
| `src/app/api.ts` | Comunicación HTTP con el backend |
| `src/styles.css` | Estilos e identidad visual |

### Pruebas y compilación

Desde la carpeta `frontend/`:

```bash
npm test
npm run build
```

Las pruebas verifican el formulario y los contratos HTTP con respuestas simuladas. La compilación se guarda en `dist/connect/browser`.

Al publicar, reenvía las rutas de la API al backend y configura el fallback a `index.html` para las rutas de la interfaz, incluida `/inscricao/:id`. El proxy de Angular solo funciona durante el desarrollo. Para una API en otro origen, configura el token `API_URL` en `src/app/api.ts` y vuelve a compilar; el backend debe permitir el origen mediante CORS y utilizar la dirección pública de la interfaz en `WEB_URL`.

## Docker

El frontend no tiene Dockerfile ni una imagen publicada documentada. La ejecución junto con los servicios de infraestructura se describe en la [guía completa](../RUNNING_THE_PROJECT.es.md).

## Contribuciones

Haz un fork, crea una rama e implementa el cambio. Ejecuta `npm test` y `npm run build` en esta carpeta y abre un pull request con una descripción e instrucciones de verificación. Para cambios visuales, incluye capturas del resultado cuando sea posible.

## Licencia

El backend declara ISC en su [package.json](../package.json). El frontend no declara una licencia propia y el repositorio todavía no tiene un archivo `LICENSE`.

## Enlaces útiles

- [Cómo ejecutar el proyecto completo](../RUNNING_THE_PROJECT.es.md).
- [Documentación del backend](../README.es.md).
- [Swagger local de la API](http://localhost:3333/docs), disponible con el backend activo.
- [Repositorio](https://github.com/gustavorods/2025_creating_an_event_registration_api_with_referral_link_using_node_and_typescript).
