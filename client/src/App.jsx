import { useState, useEffect, useCallback } from "react";

// Centralized API configuration
const API = "http://localhost:3001/api";

/**
 * Helper to generate relative time strings
 */
function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(iso).toLocaleDateString();
}

/**
 * Enhanced NoteCard with AI Summarization logic
 */
function NoteCard({ note, onDelete }) {
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // FIXED: Using API constant instead of hardcoded URL
      const res = await fetch(`${API}/notes/${note.id}/summarize`, { 
        method: "POST" 
      });
      
      if (!res.ok) throw new Error("AI Service error");
      
      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      console.error(err);
      alert("AI Service Unavailable. Check if your server is running with a valid Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-card">
      <div className="note-header">
        <span className="note-title">{note.title}</span>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button className="ai-btn" onClick={handleSummarize} disabled={loading}>
            {loading ? "..." : "✨ Prep"}
          </button>
          <button className="delete-btn" onClick={() => onDelete(note.id)} title="Delete Note">×</button>
        </div>
      </div>
      <p className="note-body">{note.body}</p>
      
      {/* Display summary if available */}
      {summary && (
        <div className="ai-summary-box">
          <strong>AI Exam Prep:</strong>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '5px' }}>
            {summary}
          </p>
        </div>
      )}

      <div className="note-meta">
        <span className="note-author">— {note.author}</span>
        <span className="note-time">{timeAgo(note.createdAt)}</span>
      </div>
    </div>
  );
}

/**
 * Improved Form with better accessibility
 */
function AddNoteForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [author, setAuthor] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); // Prevent page reload
    if (!body.trim()) return;
    
    setLoading(true);
    try {
      await onAdd({ title, body, author });
      setTitle(""); 
      setBody(""); 
      setAuthor("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="form" onSubmit={submit}>
      <input
        className="input"
        placeholder="Title (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="textarea"
        placeholder="What's on your mind? (Required)"
        value={body}
        onChange={e => setBody(e.target.value)}
        rows={4}
        required
      />
      <div className="form-row">
        <input
          className="input small"
          placeholder="Your name (optional)"
          value={author}
          onChange={e => setAuthor(e.target.value)}
        />
        <button className="btn" type="submit" disabled={loading || !body.trim()}>
          {loading ? "Posting..." : "Post Note"}
        </button>
      </div>
    </form>
  );
}

/**
 * Main Application Component
 */
export default function App() {
  const [notes, setNotes] = useState([]);
  const [error, setError] = useState(null);

  // Memoized fetch to prevent unnecessary re-renders
  const fetchNotes = useCallback(async () => {
    try {
      const res = await fetch(`${API}/notes`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setNotes(data);
      setError(null);
    } catch {
      setError("Could not reach the server. Is the backend running on port 3001?");
    }
  }, []);

  useEffect(() => { 
    fetchNotes(); 
  }, [fetchNotes]);

  const addNote = async (note) => {
    try {
      const res = await fetch(`${API}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error("Failed to save note");
      const created = await res.json();
      setNotes(prev => [created, ...prev]);
    } catch (err) {
      alert("Error adding note: " + err.message);
    }
  };

  const deleteNote = async (id) => {
    try {
      const res = await fetch(`${API}/notes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete note");
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      alert("Error deleting note: " + err.message);
    }
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
          <h2 className="section-label">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </h2>
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