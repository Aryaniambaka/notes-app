const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs'); // Added for persistence
const path = require('path'); // Added for persistence
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const app = express();
// allow overriding port (e.g. when 3001 is already in use by VS Code or other service)
const PORT = process.env.PORT || 3001;
const DATA_FILE = path.join(__dirname, 'notes.json');

app.use(cors());
app.use(express.json());

// --- Persistence Helper ---
const save = () => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(notes, null, 2));
};

// Initial Data Load from file
let notes = fs.existsSync(DATA_FILE) 
  ? JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) 
  : [{ id: uuidv4(), title: 'Welcome!', body: 'Try AI Prep!', author: 'system', createdAt: new Date().toISOString() }];

const apiKey = process.env.GEMINI_API_KEY;
let genAI;
if (apiKey) {
  genAI = new GoogleGenerativeAI(apiKey);
} else {
  console.warn('Warning: GEMINI_API_KEY not set; AI endpoints will return stub text.');
  genAI = null;
}

// --- Routes ---
app.get('/api/notes', (req, res) => {
  // support simple search and tag filters
  let results = notes.slice().reverse();
  const { q, tags } = req.query;
  if (q) {
    const term = q.toLowerCase();
    results = results.filter(n =>
      n.title.toLowerCase().includes(term) || n.body.toLowerCase().includes(term)
    );
  }
  if (tags) {
    // allow comma-separated list
    const tagList = tags.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
    if (tagList.length) {
      results = results.filter(n =>
        n.tags && n.tags.some(t => tagList.includes(t.toLowerCase()))
      );
    }
  }
  res.json(results);
});

app.post('/api/notes', (req, res) => {
  const { title, body, author, tags } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Body is required' });
  const note = {
    id: uuidv4(),
    title: title?.trim() || 'Untitled',
    body: body.trim(),
    author: author?.trim() || 'anonymous',
    tags: Array.isArray(tags) ? tags : [],
    createdAt: new Date().toISOString(),
  };
  notes.push(note);
  save(); // Save to file
  res.status(201).json(note);
});

app.delete('/api/notes/:id', (req, res) => {
  notes = notes.filter(n => n.id !== req.params.id);
  save(); // Save change
  res.json({ ok: true });
});

app.patch('/api/notes/:id', (req, res) => {
  const index = notes.findIndex(n => n.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Not found' });
  const { title, body, author, tags } = req.body;
  if (body !== undefined && !body.trim()) {
    return res.status(400).json({ error: 'Body cannot be empty' });
  }
  const note = notes[index];
  if (title !== undefined) note.title = title.trim() || 'Untitled';
  if (body !== undefined) note.body = body.trim();
  if (author !== undefined) note.author = author.trim();
  if (tags !== undefined) note.tags = Array.isArray(tags) ? tags : note.tags;
  notes[index] = note;
  save();
  res.json(note);
});



app.post('/api/notes/:id/summarize', async (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  try {
    if (!genAI) {
      return res.json({ summary: `• (sample) Your text discusses something important.\n
Sample questions:\n1. What is the topic?\n2. List one detail.` });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Provide a 5-bullet summary and 3 exam questions for: "${note.body}"`;
    const result = await model.generateContent(prompt);
    res.json({ summary: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Error' });
  }
});


// --- New quiz route ---
app.post('/api/notes/:id/quiz', async (req, res) => {
  const note = notes.find(n => n.id === req.params.id);
  if (!note) return res.status(404).json({ error: 'Not found' });
  try {
    if (!genAI) {
      // stub response for demos
      return res.json({ quiz: `1. What is the main idea of the text?\n2. Name two key points mentioned.` });
    }
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `Create 5 short-answer or multiple-choice quiz questions for the following text: "${note.body}"`;
    const result = await model.generateContent(prompt);
    res.json({ quiz: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'AI Error' });
  }
});

app.listen(PORT, () => console.log(`🚀 API running on http://localhost:${PORT} (env PORT=${process.env.PORT || ''})`));