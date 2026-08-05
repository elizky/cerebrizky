# Cerebrizky

Segundo cerebro personal. MVP web — fase 1 (captura).

Prod: https://cerebrizky.vercel.app

## Correr local

```bash
npm install
npm run migrate:dev
npm run db:seed
npm run dev
```

Seed: `izky@cerebrizky.local` / `cerebrizky`

## Env

Local (`.env.local`) y Vercel:

- `DATABASE_URL` — Neon pooler
- `DATABASE_URL_UNPOOLED` — Neon direct
- `AUTH_SECRET`
- `AUTH_URL` — local `http://localhost:3000` · prod `https://cerebrizky.vercel.app`
- Google opcional: `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`
  - Redirects: `http://localhost:3000/api/auth/callback/google` y `https://cerebrizky.vercel.app/api/auth/callback/google`

## Qué se puede hacer hoy

- Login / register (credentials; Google si hay env)
- Home cerebro: cards solo de regiones con contenido + Inbox + Search
- Quick Capture → crea `IDEA` en Inbox (`source=WEB`)
- CRUD de items: `IDEA`, `NOTE`, `TASK`, `LINK`, `BOOK`, `PROJECT`
- Crear vía modal; click en card → detalle lectura; lápiz → edición
- Estados acotados por tipo; tablero (kanban) en Tareas y Libros
- Notas/libros: contenido Markdown en vista lectura
- Asignar proyecto, archivar / restaurar / borrar
- Tags (crear, asignar, quitar)
- Relaciones item ↔ item
- Vista de proyecto con hijos agrupados por tipo
- Búsqueda por título / contenido / URL
- Textos UI en `messages/es.json` vía `lib/copy.ts`

## No está (fases siguientes)

- ESP32 / `POST /api/ingest`
- IA para clasificar type
- Import desde bitacorizky / gastizky
- Grafo, adjuntos, backlinks automáticos, búsqueda semántica
