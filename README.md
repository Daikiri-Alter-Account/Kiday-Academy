# Kiday Academy

Plataforma web para estudiantes de colegio, universidad y aprendizaje autónomo. Kiday reúne organización académica, herramientas de estudio, un catálogo de planes, un formulario de contacto real, un panel administrativo y un asistente con IA.

[![CI](https://github.com/Daikiri-Alter-Account/Kiday-Academy/actions/workflows/ci.yml/badge.svg)](https://github.com/Daikiri-Alter-Account/Kiday-Academy/actions/workflows/ci.yml)

Proyecto final del curso de desarrollo web avanzado. Frontend y backend están separados y se despliegan de forma independiente.

- **Frontend publicado:** https://daikiri-alter-account.github.io/Kiday-Academy/
- **Repositorio:** https://github.com/Daikiri-Alter-Account/Kiday-Academy
- **API:** pendiente de desplegar en Render (configuración lista en `render.yaml`).

## Funcionalidades

### Sitio público
- Landing responsive con identidad de marca, propuesta de valor y vista previa del producto.
- Catálogo de planes conectado a MongoDB (`/api/services`), con estados de carga, error y reintento.
- Formulario de contacto real con validación en cliente y servidor, rate limit y confirmación de envío.
- Metadatos SEO, datos estructurados, iconos, manifiesto y tema claro/oscuro persistente.

### Aplicación académica
- Panel con métricas derivadas de las materias y tareas reales, accesos rápidos y resumen de la semana.
- CRUD de materias con promedio, estado y avance de actividades. Eliminar una materia también elimina sus tareas.
- Tareas y recordatorios con fecha de entrega, prioridad, filtros, tareas atrasadas y vista de los próximos siete días.
- Promediador ponderado funcional, con cálculo en vivo y validaciones.
- Registro e inicio de sesión de estudiantes con correo y contraseña.
- Espacio académico local por usuario: cada cuenta conserva sus materias y tareas en su propio navegador.
- Asistente Kiday IA conectado a un proveedor compatible con OpenAI. El backend inyecta el catálogo vigente en el prompt para que las recomendaciones sean reales.
- Rutas de la aplicación y del panel administrativo protegidas, con fallback de SPA para GitHub Pages.

### Administración
- Inicio de sesión con email y contraseña; hash `scrypt` y sesiones opacas con tokens SHA-256.
- Panel con métricas, últimos mensajes, bandeja de contacto con estados y eliminación.
- CRUD completo de planes: crear, editar, activar/desactivar, destacar y eliminar.
- Todas las rutas `/api/admin/*` requieren sesión con rol `admin`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS 4, React Router 7, lucide-react |
| Backend | Node.js 22, Express 5, MongoDB (driver nativo) |
| Base de datos | MongoDB Atlas o MongoDB local |
| IA | API compatible con OpenAI (`AI_API_URL`, `AI_MODEL`, `AI_API_KEY`) |
| Deploy | GitHub Pages (frontend) + Render (backend) + MongoDB Atlas |

No se usan librerías de UI, estado global ni autenticación de terceros. La autenticación, el rate limit y las validaciones están implementados en el backend.

## Estructura

```
.
├── frontend/                 # SPA React + Vite
│   ├── public/               # iconos, manifiesto, SEO y sitemap
│   ├── scripts/postbuild.mjs # genera 404.html para GitHub Pages
│   └── src/
│       ├── components/       # UI compartida, catálogo, contacto, guards
│       ├── layouts/          # shells de la app y del panel admin
│       ├── lib/              # cliente API, auth, tema y espacio académico
│       └── pages/            # landing, panel, materias, tareas, admin, 404
├── backend/                  # API Express
│   └── src/
│       ├── lib/              # auth, validación, rate limit, errores
│       ├── routes/           # services, contact, auth, admin, ai
│       ├── scripts/          # seed, smoke test e inspector de base de datos
│       └── seed.js           # datos iniciales e índices
├── docs/                     # documentación de la base de datos
├── scripts/dev.mjs           # arranca API y frontend juntos
├── package.json              # comandos raíz: dev, test, build, db:inspect
├── .github/workflows/        # CI y deploy del frontend a GitHub Pages
└── render.yaml               # blueprint del backend en Render
```

## Requisitos

- Node.js 22 o superior.
- npm 10 o superior.
- Una base MongoDB: Atlas (recomendado) o local.
- Opcional: clave de un proveedor de IA compatible con OpenAI.

## Desarrollo local

Después de instalar las dependencias de `backend` y `frontend` y configurar los entornos, puedes arrancar todo desde la raíz:

```bash
npm run dev
```

Esto inicia la API en `http://localhost:4000` y Vite en `http://localhost:5173`. También puedes arrancarlos por separado con `npm run dev:backend` y `npm run dev:frontend`.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edita `backend/.env`:

```env
PORT=4000
MONGO_URL=mongodb+srv://usuario:clave@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB=kiday_academy
CORS_ORIGIN=http://localhost:5173,http://localhost:4173

ADMIN_NAME=Administrador Kiday
ADMIN_EMAIL=admin@kiday.studio
ADMIN_PASSWORD=una-clave-segura

AI_API_URL=https://api.openai.com/v1/chat/completions
AI_API_KEY=
AI_MODEL=gpt-4o-mini
```

#### Proveedores de IA gratuitos

Kiday IA acepta cualquier API compatible con el formato de OpenAI. Proveedores con capa gratuita sin tarjeta (los límites pueden cambiar):

- **Groq:** `https://api.groq.com/openai/v1/chat/completions`. Crea la clave en [console.groq.com](https://console.groq.com/keys) y usa el ID exacto del modelo que aparezca en su catálogo.
- **OpenRouter:** `https://openrouter.ai/api/v1/chat/completions`. Crea la clave en [openrouter.ai/settings/keys](https://openrouter.ai/settings/keys) y usa `openrouter/free` o un modelo terminado en `:free`.
- **Google Gemini:** `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`. Crea la clave en [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) y usa el ID del modelo Flash disponible.

La clave debe permanecer en el backend; nunca debe exponerse en el frontend ni en el repositorio. Sin `AI_API_KEY`, el asistente responde `503` con un mensaje informativo.

Crea los índices, los tres planes iniciales y el administrador:

```bash
npm run seed
```

Inicia la API:

```bash
npm run dev
```

La API queda en `http://localhost:4000`. Verifica `GET /api/health`.

> El seed es idempotente para servicios y no duplica el administrador si ya existe.

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Abre `http://localhost:5173`. Si no defines `VITE_API_URL`, el cliente usa `http://localhost:4000`.

Abre `http://localhost:5173/registro` para crear una cuenta de estudiante o `http://localhost:5173/login` para iniciar sesión. Las materias y tareas se guardan en el navegador con una clave por usuario, por ejemplo `kiday-study-workspace-v1:<id>`. El catálogo, las cuentas, el contacto, el admin y la IA usan la API y MongoDB.

### 3. Panel administrativo

Entra a `http://localhost:5173/admin/login` con el `ADMIN_EMAIL` y `ADMIN_PASSWORD` definidos en `backend/.env`. El enlace **Admin** también está en el pie de la landing.

### 4. Base de datos

La estructura completa, relaciones, índices y ejemplos están en [`docs/base-de-datos.md`](docs/base-de-datos.md). Para ver un resumen desde la terminal:

```bash
cd backend
npm run db:inspect
```

### 5. Pruebas

```bash
cd backend
npm test
```

El smoke test levanta una MongoDB en memoria, siembra datos y verifica catálogo, contacto, registro de estudiantes, login, sesiones, permisos, estadísticas, mensajes, CRUD de servicios, IA no configurada y cierre de sesión. La primera ejecución descarga el binario de MongoDB y puede tardar unos minutos.

Compilación del frontend:

```bash
cd frontend
npm run build
```

El build ejecuta `tsc --noEmit`, Vite y genera `dist/404.html` para que las rutas profundas funcionen en GitHub Pages.

GitHub Actions ejecuta el workflow **CI** en cada push y pull request: levanta la API con MongoDB en memoria y compila el frontend. El workflow **Deploy frontend to GitHub Pages** publica el sitio desde `main`.

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Requerida | Descripción |
| --- | --- | --- |
| `PORT` | No | Puerto HTTP. Por defecto `4000`. |
| `MONGO_URL` | Sí | Cadena de conexión de MongoDB. |
| `MONGO_DB` | No | Nombre de la base. Por defecto `kiday_academy`. |
| `CORS_ORIGIN` | Sí en producción | Orígenes permitidos, separados por coma. |
| `ADMIN_NAME` | No | Nombre visible del administrador. |
| `ADMIN_EMAIL` | Sí para el seed | Email del administrador. |
| `ADMIN_PASSWORD` | Sí para el seed | Contraseña inicial. Cámbiala antes de publicar. |
| `AI_API_URL` | No | Endpoint compatible con `/chat/completions`. |
| `AI_API_KEY` | No | Clave del proveedor. Sin ella, `/api/ai/chat` responde `503`. |
| `AI_MODEL` | No | Modelo a usar. Por defecto `gpt-4o-mini`. |

### Frontend (`frontend/.env.local`)

| Variable | Descripción |
| --- | --- |
| `VITE_API_URL` | URL pública del backend, sin barra final. En local: `http://localhost:4000`. |

## API

| Método | Ruta | Acceso | Descripción |
| --- | --- | --- | --- |
| GET | `/api/health` | Público | Estado del servicio. |
| GET | `/api/services` | Público | Planes activos ordenados. |
| POST | `/api/contact` | Público | Crea un mensaje de contacto. |
| POST | `/api/auth/register` | Público con rate limit | Crea una cuenta de estudiante y devuelve token. |
| POST | `/api/auth/login` | Público con rate limit | Inicia sesión y devuelve token. |
| GET | `/api/auth/me` | Sesión | Devuelve el usuario autenticado. |
| POST | `/api/auth/logout` | Sesión | Invalida la sesión. |
| GET | `/api/admin/stats` | Admin | Métricas del panel. |
| GET | `/api/admin/messages` | Admin | Lista mensajes; filtro `?status=nuevo`. |
| PATCH | `/api/admin/messages/:id` | Admin | Cambia el estado del mensaje. |
| DELETE | `/api/admin/messages/:id` | Admin | Elimina un mensaje. |
| GET | `/api/admin/services` | Admin | Lista todos los planes. |
| POST | `/api/admin/services` | Admin | Crea un plan. |
| PATCH | `/api/admin/services/:id` | Admin | Actualiza un plan. |
| DELETE | `/api/admin/services/:id` | Admin | Elimina un plan. |
| POST | `/api/ai/chat` | Público con rate limit | Conversa con Kiday IA. |

Las rutas protegidas esperan `Authorization: Bearer <token>`. El token se guarda en `localStorage` con la clave `kiday-token`.

## Despliegue

### 1. MongoDB Atlas

1. Crea un clúster gratuito (M0).
2. Crea un usuario de base de datos y permite el acceso desde Render (`0.0.0.0/0` o el rango de Render).
3. Copia la cadena `mongodb+srv://...` y úsala como `MONGO_URL`.

### 2. Backend en Render

1. En Render, elige **New > Blueprint** y conecta este repositorio. `render.yaml` crea el servicio `kiday-academy-api`.
2. Define las variables marcadas con `sync: false`: `MONGO_URL`, `CORS_ORIGIN`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `AI_API_URL`, `AI_API_KEY` y `AI_MODEL`.
3. `CORS_ORIGIN` debe incluir el origen del frontend: `https://daikiri-alter-account.github.io`.
4. Tras el primer deploy, ejecuta el seed una vez desde la shell de Render:

```bash
npm run seed
```

5. Comprueba `https://TU-SERVICIO.onrender.com/api/health`.

### 3. Frontend en GitHub Pages

1. En **Settings > Pages**, selecciona **GitHub Actions** como fuente.
2. En **Settings > Secrets and variables > Actions > Variables**, crea `VITE_API_URL` con la URL del backend en Render, sin `/` final.
3. Ejecuta el workflow **Deploy frontend to GitHub Pages** o haz push a `main`.
4. El sitio queda en `https://daikiri-alter-account.github.io/Kiday-Academy/`.

`frontend/vite.config.ts` usa la base `/Kiday-Academy/` en producción. El script `postbuild.mjs` copia el HTML a `404.html` para que React Router resuelva rutas como `/admin/login` al recargar.

## Seguridad

- Contraseñas con `scrypt` y sal aleatoria; nunca se guarda la contraseña en claro.
- Sesiones opacas: el cliente recibe un token aleatorio y la base guarda solo su hash SHA-256, con expiración de 7 días.
- Rate limit en registro, login, contacto y chat de IA.
- Validación y normalización de entradas en el backend; errores internos no se filtran al cliente.
- El catálogo público solo expone planes activos.
- El endpoint de IA no requiere sesión para que el asistente sea accesible desde la demo, pero está limitado a 20 solicitudes cada 10 minutos por IP y a 700 tokens de salida.
- Las claves de Mongo, admin e IA viven únicamente en variables de entorno del backend.
- Los estudiantes solo acceden a `/app`; las rutas `/api/admin/*` exigen rol `admin`.

Para una siguiente etapa se recomienda migrar el token a cookies `HttpOnly`, agregar verificación de email y limitar el chat a usuarios autenticados.

## Roadmap

- Sincronización de materias, notas y tareas entre dispositivos.
- Calendario completo con vista mensual, recordatorios por email o push y notificaciones.
- Comunidades por materia y chats privados.
- Biblioteca de materiales de estudio.
- Historial de conversaciones del asistente y límites por plan.

## Licencia

MIT. Consulta `LICENSE`.
