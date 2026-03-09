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
function NoteCard({ note, onDelete, onEdit }) {
  const [summary, setSummary] = useState("");
  const [quiz, setQuiz] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSummarize = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/notes/${note.id}/summarize`, { 
        method: "POST" 
      });
      if (!res.ok) throw new Error("AI Service error");
      const data = await res.json();
      setSummary(data.summary);
      setQuiz("");
    } catch (err) {
      console.error(err);
      alert("AI Service Unavailable. Check if your server is running with a valid Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleQuiz = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/notes/${note.id}/quiz`, { method: "POST" });
      if (!res.ok) throw new Error("AI Service error");
      const data = await res.json();
      setQuiz(data.quiz);
      setSummary("");
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
          <button className="ai-btn" onClick={handleQuiz} disabled={loading} title="Generate quiz">
            {loading ? "..." : "❓ Quiz"}
          </button>
          <button className="ai-btn" onClick={() => onEdit && onEdit(note)} title="Edit Note">✎</button>
          <button className="delete-btn" onClick={() => onDelete(note.id)} title="Delete Note">×</button>
        </div>
      </div>
      <p className="note-body">{note.body}</p>
      {note.tags && note.tags.length > 0 && (
        <div className="note-tags">
          {note.tags.map(t => (
            <span key={t} className="tag">{t}</span>
          ))}
        </div>
      )}
      {/* Display summary or quiz if available */}
      {(summary || quiz) && (
        <div className="ai-summary-box">
          <strong>AI Exam Prep:</strong>
          <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.8rem', marginTop: '5px' }}>
            {summary || quiz}
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
function AddNoteForm({ onSubmit, initial = {}, onCancel }) {
  const [title, setTitle] = useState(initial.title || "");
  const [body, setBody] = useState(initial.body || "");
  const [author, setAuthor] = useState(initial.author || "");
  const [tags, setTags] = useState((initial.tags || []).join(", "));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setTitle(initial.title || "");
    setBody(initial.body || "");
    setAuthor(initial.author || "");
    setTags((initial.tags || []).join(", "));
  }, [initial]);

  const submit = async (e) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    try {
      const tagArray = tags.split(',').map(t => t.trim()).filter(Boolean);
      await onSubmit({ title, body, author, tags: tagArray });
      if (!initial.id) {
        // clear only on create
        setTitle("");
        setBody("");
        setAuthor("");
        setTags("");
      }
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
        <input
          className="input small"
          placeholder="Tags (comma-separated)"
          value={tags}
          onChange={e => setTags(e.target.value)}
        />
        <button className="btn" type="submit" disabled={loading || !body.trim()}>
          {loading ? (initial.id ? "Saving..." : "Posting...") : (initial.id ? "Save" : "Post Note")}
        </button>
        {initial.id && onCancel && (
          <button type="button" className="btn cancel" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        )}
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
  const [search, setSearch] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [editing, setEditing] = useState(null);

  // Memoized fetch to prevent unnecessary re-renders
  const fetchNotes = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.set('q', search.trim());
      if (tagFilter.trim()) params.set('tags', tagFilter.trim());
      const url = `${API}/notes` + (params.toString() ? `?${params}` : '');
      const res = await fetch(url);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setNotes(data);
      setError(null);
    } catch {
      setError("Could not reach the server. Is the backend running on port 3001?");
    }
  }, [search, tagFilter]);

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

  const updateNote = async (id, note) => {
    try {
      const res = await fetch(`${API}/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (!res.ok) throw new Error("Failed to update note");
      const updated = await res.json();
      setNotes(prev => prev.map(n => (n.id === id ? updated : n)));
    } catch (err) {
      alert("Error updating note: " + err.message);
    }
  };

  const handleSubmit = async (noteData) => {
    if (editing && editing.id) {
      await updateNote(editing.id, noteData);
      setEditing(null);
    } else {
      await addNote(noteData);
    }
  };

  const startEdit = (note) => setEditing(note);
  const cancelEdit = () => setEditing(null);

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
          <h2 className="section-label">{editing ? "Edit note" : "Add a note"}</h2>
          <AddNoteForm
            initial={editing || {}}
            onSubmit={handleSubmit}
            onCancel={editing ? cancelEdit : null}
          />
        </section>

        <section className="board">
          <h2 className="section-label">
            {notes.length} note{notes.length !== 1 ? "s" : ""}
          </h2>
          {/* search & tag filters */}
          <div className="filter-row">
            <input
              className="input small"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <input
              className="input small"
              placeholder="Filter tags (comma sep)"
              value={tagFilter}
              onChange={e => setTagFilter(e.target.value)}
            />
            <button className="btn" onClick={fetchNotes}>Go</button>
          </div>
          {error && <p className="error">{error}</p>}
          <div className="grid">
            {notes.map(note => (
              <NoteCard
                key={note.id}
                note={note}
                onDelete={deleteNote}
                onEdit={startEdit}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}