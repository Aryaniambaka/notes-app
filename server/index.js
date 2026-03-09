const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// --- In-memory store (swap for a DB later) ---
let notes = [
  { id: uuidv4(), title: 'Welcome!', body: 'This is a shared notes board. Add your own notes below.', author: 'system', createdAt: new Date().toISOString() },
];

// --- Routes ---

// GET all notes
app.get('/api/notes', (req, res) => {
  res.json(notes.slice().reverse()); // newest first
});

// POST a new note
app.post('/api/notes', (req, res) => {
  const { title, body, author } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Body is required' });

  const note = {
    id: uuidv4(),
    title: title?.trim() || 'Untitled',
    body: body.trim(),
    author: author?.trim() || 'anonymous',
    createdAt: new Date().toISOString(),
  };

  notes.push(note);
  res.status(201).json(note);
});

// DELETE a note
app.delete('/api/notes/:id', (req, res) => {
  const before = notes.length;
  notes = notes.filter(n => n.id !== req.params.id);
  if (notes.length === before) return res.status(404).json({ error: 'Not found' });
  res.json({ ok: true });
});

// PATCH (edit) a note
app.patch('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  const { title, body } = req.body;
  if (title !== undefined) note.title = title.trim();
  if (body !== undefined) note.body = body.trim();
  note.updatedAt = new Date().toISOString();
  res.json(note);
});

app.listen(PORT, () => console.log(`Notes API running on http://localhost:${PORT}`));
