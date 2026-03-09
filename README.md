# notes — a simple shared notes platform

A minimal, extendable notes board. Post notes, see everyone's notes, delete your own.

## Structure

```
notes-app/
├── server/        # Express API
│   └── index.js   # All routes live here
└── client/        # React + Vite frontend
    └── src/
        ├── App.jsx      # All UI components
        └── index.css    # Styles
```

## Quick Start

**Terminal 1 — API server**
```bash
cd server
npm install
npm start        # runs on :3001
# or: npm run dev   (with auto-reload via nodemon)
```

**Terminal 2 — React frontend**
```bash
cd client
npm install
npm run dev      # runs on :3000
```

Open http://localhost:3000

---

## API

| Method | Route            | Description       |
|--------|------------------|-------------------|
| GET    | /api/notes       | List all notes    |
| POST   | /api/notes       | Create a note     |
| PATCH  | /api/notes/:id   | Edit a note       |
| DELETE | /api/notes/:id   | Delete a note     |

### POST /api/notes body
```json
{ "title": "string", "body": "string (required)", "author": "string" }
```

---

## Easy ways to extend

- **Persistence** — swap the `notes` array in `server/index.js` for SQLite (`better-sqlite3`) or Postgres (`pg`)
- **Tags** — add a `tags` field to the note model and filter by tag in the frontend
- **Search** — add `GET /api/notes?q=keyword` and a search input
- **Auth** — add a simple JWT middleware in `server/index.js`
- **Reactions** — add a `likes` counter to the note model and a `POST /api/notes/:id/like` route
- **Real-time** — drop in `socket.io` on the server and `useEffect` socket listeners on the client
