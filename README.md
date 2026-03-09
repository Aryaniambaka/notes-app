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

### Deploying quickly
1. **Backend**: create a free app on Heroku or Railway, set `GEMINI_API_KEY` in config vars, and deploy the `server/` folder (Procfile: `web: node index.js`).
2. **Frontend**: point Vercel/Netlify at the `client/` directory; update the proxy or API_BASE if necessary. 
3. If you don’t have a key, the app still runs thanks to stub AI responses (see API docs above).

For hackathon submission, capture a live demo link or screen recording and include it in your entry.

---

## API

| Method | Route            | Description       |
|--------|------------------|-------------------|
| GET    | /api/notes       | List all notes (supports `?q=` search and `?tags=a,b` filter) |
| POST   | /api/notes       | Create a note (body may include `tags` array) |
| PATCH  | /api/notes/:id   | Edit a note       |
| DELETE | /api/notes/:id   | Delete a note     |
| POST   | /api/notes/:id/summarize | Generate AI summary + questions |
| POST   | /api/notes/:id/quiz | Generate AI quiz questions (returns sample text if GEMINI_API_KEY not set) |

### POST /api/notes body
```json
{ "title": "string", "body": "string (required)", "author": "string", "tags": ["tag1","tag2"] }
```

*Note*: The hackathon version of the app focuses on generative AI features like summarization and quiz generation. Tags and search help surface relevant notes quickly.
---

## Easy ways to extend

- **Persistence** — swap the `notes` array in `server/index.js` for SQLite (`better-sqlite3`) or Postgres (`pg`)
- **Tags** — add a `tags` field to the note model and filter by tag in the frontend
- **Search** — add `GET /api/notes?q=keyword` and a search input
- **Auth** — add a simple JWT middleware in `server/index.js`
- **Reactions** — add a `likes` counter to the note model and a `POST /api/notes/:id/like` route
- **Real-time** — drop in `socket.io` on the server and `useEffect` socket listeners on the client
