# Cerebrizky

Segundo cerebro personal. MVP web.

## Correr

```bash
npm install
npm run migrate:dev   # usa .env.local via dotenv-cli
npm run db:seed       # opcional: usuario + datos demo
npm run dev
```

Seed: `izky@cerebrizky.local` / `cerebrizky`

Env: `DATABASE_URL` (pooler), `DATABASE_URL_UNPOOLED` (direct), `AUTH_SECRET`. Google OAuth opcional.

## Qué se puede hacer hoy

- Login / register (credentials; Google si hay env)
- Home cerebro: cards solo de regiones con contenido + Inbox + Search
- Quick Capture → crea `IDEA` en Inbox (`source=WEB`)
- CRUD de items: `IDEA`, `NOTE`, `TASK`, `LINK`, `BOOK`, `PROJECT`
- Asignar proyecto, status, archivar / restaurar / borrar
- Tags (crear, asignar, quitar)
- Relaciones item ↔ item
- Vista de proyecto con hijos agrupados por tipo
- Búsqueda por título / contenido / URL

## No está (fase 2)

- ESP32 / `POST /api/ingest`
- IA para clasificar type
- Import desde bitacorizky / gastizky
- Grafo, adjuntos, backlinks automáticos
