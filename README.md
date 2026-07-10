# GrowEasy CSV → CRM Importer

A robust, intelligent importer that takes a CSV lead export in **any layout** — Facebook Lead Ads, Google Ads, spreadsheets, or other CRMs — and automatically maps it into a fixed CRM schema.

---

## How it works

```
┌──────────────┐   1. upload CSV    ┌──────────────────┐
│   Frontend   │ ─────────────────▶ │      Backend     │
│   (Next.js)  │                    │     (Node.js)    │
│              │ ◀───────────────── │                  │
└──────────────┘  SSE progress +    └──────────────────┘
                   final JSON               │
                                            │ batches of rows
                                            ▼
                                    ┌──────────────────┐
                                    │  Mapping Engine  │
                                    └──────────────────┘
```

1. **Upload** — Users can drag in a CSV or pick one via the file explorer.
2. **Preview** — The file is parsed entirely in the browser (using PapaParse) and shown in a sticky-header, scrollable table exactly as it is in the source file. No backend call happens at this step.
3. **Confirm** — Upon confirmation, the frontend POSTs the file to the backend.
4. **Smart Mapping** — The backend splits rows into batches, sends each batch to the intelligent mapping engine with explicit business rules, and streams progress back to the browser over Server-Sent Events (SSE).
5. **Validation** — The mapping engine's output is treated as a strong prior, not ground truth. A separate validation layer re-checks every hard rule in code (enum membership, date parseability, and skip criteria) and repairs or reclassifies anything that doesn't hold up.
6. **Results** — The frontend displays imported vs. skipped records in two tables, providing row-level skip reasons and summary statistics.

---

## Features

- Drag & drop upload with a file picker fallback.
- Live progress indicator streamed over Server-Sent Events.
- Smart column mapping that understands semantic meaning, rather than relying on exact string matches.
- Strict code-level validation of all mapped data to ensure CRM data integrity.
- Retry logic with exponential backoff for mapping engine requests.
- Downloadable sample CSV templates.
- Full Docker support for easy deployment.

---

## Project Structure

```
backend/
  src/
    server.js              Express app entry point
    routes/csvRoutes.js    /api/csv/import (SSE), /api/csv/sample
    services/
      csvService.js        header-agnostic CSV → row objects
      aiService.js         mapping engine integration
      validationService.js authoritative post-mapping validation
      importPipeline.js    wires the above together with progress callback
    middleware/            multer upload config, error handler
    config/constants.js    CRM_FIELDS, allowed enums, batch size, retries
  tests/                   jest unit tests (validation + csv parsing)

frontend/
  app/
    page.tsx               upload → preview → processing → results flow
    components/            React UI components
  lib/
    api.ts                 SSE client for the import endpoint
    types.ts               shared TS types
```

---

## Local Setup

Requires Node.js 18+.

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY (this serves as the mapping engine API key)
npm install
npm run dev        # http://localhost:4000
```

Run the unit test suite:

```bash
npm test
```

### 2. Frontend

```bash
cd frontend
cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL should point at the backend above
npm install
npm run dev        # http://localhost:3000
```

Open `http://localhost:3000` to upload a CSV and test the importer.

### 3. Docker (optional)

Run both services together seamlessly using Docker Compose:

```bash
export GEMINI_API_KEY=your_key_here
docker compose up --build
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:4000`

---

## Environment Variables

**Backend (`backend/.env`)**

| Variable | Required | Default | Notes |
|---|---|---|---|
| `GEMINI_API_KEY` | yes | — | Required for the smart mapping engine. |
| `GEMINI_MODEL` | no | `gemini-2.0-flash` | |
| `PORT` | no | `4000` | |
| `CORS_ORIGIN` | no | `http://localhost:3000` | comma-separated list |
| `BATCH_SIZE` | no | `15` | rows sent to the mapping engine per request |
| `MAX_RETRIES` | no | `3` | per-batch retry attempts |

**Frontend (`frontend/.env.local`)**

| Variable | Required | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | yes | `http://localhost:4000` |
