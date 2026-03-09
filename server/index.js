const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'notes.json');

app.use(cors());
app.use(express.json());

// --- Persistence Helper ---
// This function writes the current 'notes' array to the physical notes.json file
const save = () => {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2), 'utf8');
  } catch (err) {
    console.error("Failed to save notes to file:", err);
  }
};

// --- Initial Data Load ---
// Loads notes from the file on startup, or starts with an empty list
let notes = fs.existsSync(DATA_FILE) 
  ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) 
  : [];

// --- AI Configuration ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// --- API Routes ---

// GET: Retrieve all notes
app.get('/api/notes', (req, res) => {
  res.json(notes.slice().reverse()); // newest first
});

// POST: Create a new note
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
  save(); // Persist changes to notes.json
  res.status(201).json(note);
});

// DELETE: Remove a note by ID
app.delete('/api/notes/:id', (req, res) => {
  const before = notes.length;
  notes = notes.filter(n => n.id !== req.params.id);
  
  if (notes.length === before) {
    return res.status(404).json({ error: 'Not found' });
  }

  save(); // Persist changes to notes.json
  res.json({ ok: true });
});

// PATCH: Update an existing note
app.patch('/api/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });

  const { title, body } = req.body;
  if (title !== undefined) note.title = title.trim();
  if (body !== undefined) note.body = body.trim();
  note.updatedAt = new Date().toISOString();

  save(); // Persist changes to notes.json
  res.json(note);
});

// POST: AI Summarization and Exam Prep
app.post('/api/notes/:id/summarize', async (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Note not found' });

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `You are an academic assistant. Analyze the following student note and provide:
    1. A 5-bullet point concise summary.
    2. Three potential exam questions based on this content.
    Note Content: "${note.body}"`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    res.json({ summary: response.text() });
  } catch (error) {
    console.error("Gemini AI Error:", error);
    res.status(500).json({ error: 'AI generation failed. Check API key.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Notes API running on http://localhost:${PORT}`);
});