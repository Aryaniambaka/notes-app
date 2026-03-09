import { useState, useEffect, useCallback } from "react";

const API = "http://localhost:3001/api";
function NoteCard({ note, onDelete }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/notes/${note.id}/summarize`, { method: "POST" });
      const data = await res.json();
      setSummary(data.summary);
    } catch {
      alert("AI Service Unavailable");
    }
    setLoading(false);
  };

  return (
    <div className="note-card">
      <div className="note-header">
        <span className="note-title">{note.title}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button className="ai-btn" onClick={handleSummarize} disabled={loading}>
            {loading ? "..." : "✨ Prep"}
          </button>
          <button className="delete-btn" onClick={() => onDelete(note.id)}>×</button>
        </div>
      </div>
      <p className="note-body">{note.body}</p>
      
      {summary && (
        <div className="ai-summary-box">
          <strong>AI Exam Prep:</strong>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem' }}>{summary}</p>
        </div>
      )}

      <div className="note-meta">
        <span className="note-author">— {note.author}</span>
        <span className="note-time">{timeAgo(note.createdAt)}</span>
      </div>
    </div>
  );
}
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}



function AddNoteForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!body.trim()) return;
    setLoading(true);
    await onAdd({ title, body, author });
    setTitle(""); setBody(""); setAuthor("");
    setLoading(false);
  };

  return (
    <div className="form">
      <input
        className="input"
        placeholder="Title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="textarea"
        placeholder="What's on your mind?"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={4}
      />
      <div className="form-row">
        <input
          className="input small"
          placeholder="Your name (optional)"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        />
        <button className="btn" onClick={submit} disabled={loading || !body.trim()}>
          {loading ? "Posting..." : "Post Note"}
        </button>
      </div>
    </div>
  );
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`${API}/notes`);
      const data = await res.json();
      setNotes(data);
    } catch {
      setError("Could not reach the server. Is it running?");
    }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const addNote = async (note) => {
    const res = await fetch(`${API}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(note),
    });
    const created = await res.json();
    setNotes(prev => [created, ...prev]);
  };

  const deleteNote = async (id) => {
    await fetch(`${API}/notes/${id}`, { method: "DELETE" });
    setNotes(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="app">
      <header className="header">
        <h1 className="logo">notes</h1>
        <span className="tagline">shared. simple. open.</span>
      </header>

      <main className="main">
        <section className="compose">
          <h2 className="section-label">Add a note</h2>
          <AddNoteForm onAdd={addNote} />
        </section>

        <section className="board">
          <h2 className="section-label">{notes.length} note{notes.length !== 1 ? "s" : ""}</h2>
          {error && <p className="error">{error}</p>}
          <div className="grid">
            {notes.map(note => (
              <NoteCard key={note.id} note={note} onDelete={deleteNote} />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
