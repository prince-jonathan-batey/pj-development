import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from '../content/AuthContext';
import { 
  analyzeJournal, 
  createJournal, 
  listJournals, 
  updateJournal, 
  deleteJournal 
} from "../api/journal";
import MoodChart from "../components/MoodChart";

const JournalPage = () => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [insight, setInsight] = useState("");
  const [mood, setMood] = useState("");
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const load = useCallback(async (targetPage = page) => {
    try {
      const data = await listJournals(targetPage, limit);
      const items = Array.isArray(data) ? data : data.items || [];
      const nextPage = Array.isArray(data) ? 1 : data.page || 1;
      const nextTotalPages = Array.isArray(data) ? 1 : (data?.totalPages ?? 1);

      setEntries(items);
      setPage(nextPage);
      setTotalPages(nextTotalPages);
    } catch (error) {
      console.error("Error loading journal entries:", error);
        setEntries([]);
    }
  }, [page, limit]);

  useEffect(() => {
    load(page);
  }, [page, load]);

  const handleAnalyze = async () => {
    if (!text) return;
    setLoading(true);
    try {
      const res = await analyzeJournal(text);
      setInsight(res.insight || "");
      setMood(res.mood || "");
    } catch (e) {
      console.error(e);
      setInsight("Error analyzing journal entry");
      setMood("");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!text) return;
    setLoading(true);
    try {
      await createJournal(text, mood, insight);
      setText("");
      setInsight("");
      setMood("");
      await load(page);            
    } catch (e) {
      console.error("Error saving journal entry:", e);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditText(entry.context);
  };

  const saveEdit = async () => {
    if (!editText) return;
    try {
      await updateJournal(editingId, editText);
      setEditText("");
      setEditingId(null);
      await load(page);
    } catch (e) {
      console.error(e);
      alert("Error updating journal entry");
    } 
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try {
      await deleteJournal(id);
      await load(page);            
    } catch (e) {
      console.error(e);
      alert("Error deleting journal entry");
    }
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h2>Journal</h2>
      <div style={{ marginBottom: 16, color: "#666" }}>
        Logged in as <strong>{user?.email}</strong>
      </div>

      <textarea 
        value={text} 
        onChange={(e) => setText(e.target.value)} 
        placeholder="Write your journal entry here..."
        rows="6"
        cols="50"
        style={{ width: "100%", padding: 10 }}
      />
      <div style={{ marginTop: 10 }}>
        <button onClick={handleAnalyze} disabled={loading} style={{ marginRight: 10 }}>
          {loading ? "Analyzing..." : "Analyze"}
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !text.trim() || !insight}
        >
          {loading ? "Saving..." : "Save Entry"}
        </button>
      </div>

      {(mood || insight) && (
        <div style={{ marginTop: 12, padding: 12, background: "#f6f8fa", borderRadius: 6 }}>
          {mood && (
            <span style={{
              padding: "2px 8px",
              borderRadius: 12,
              background: "#eef",
              color: "#00796b",
              marginRight: 8,
              fontSize: 12,
              textTransform: "capitalize"
            }}>
              {mood}
            </span>
          )}
          {insight && (
            <>
              <strong>Ai Insights: </strong>{insight}
            </>
          )}
        </div>
      )}

      <hr style={{ margin: "24px 0" }} />

      <h3>Your Journal Entries</h3>
      {(entries?.length ?? 0) === 0 ? (
        <p>No entries yet</p>
      ) : (
        <>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {entries.map((e) => (
              <li key={e._id} style={{ border: "1px solid #ddd", marginBottom: 12, padding: 12, borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: 'space-between', alignItems: "baseline" }}>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {new Date(e.createdAt).toLocaleString()}
                  </div>
                  {e.mood && (
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 12,
                      background: "#eef",
                      color: "#00796b",
                      fontSize: 12,
                      textTransform: "capitalize"
                    }}>
                      {e.mood}
                    </span>
                  )}
                </div>

                {editingId === e._id ? (
                  <>
                    <textarea 
                      value={editText} 
                      onChange={(e) => setEditText(e.target.value)} 
                      rows={4}
                      style={{ width: "100%", padding: 10, marginTop: 6 }}
                    />
                    <div style={{ marginTop: 8 }}>
                      <button onClick={saveEdit} style={{ marginRight: 8 }}>
                        Save Edit
                      </button>
                      <button onClick={() => { setEditingId(null); setEditText(''); }}>
                        Cancel
                      </button>
                    </div>   
                  </>
                ) : (
                  <>
                    <div style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>{e.context}</div>
                    {e.insight && (
                      <div style={{ marginTop: 8, padding: 10, background: "#f8f9fb", borderRadius: 6 }}>
                        <strong>AI Insight:</strong> {e.insight}
                      </div>
                    )}
                    <div style={{ marginTop: 8 }}>
                      <button onClick={() => startEdit(e)} style={{ marginRight: 8 }}>
                        Edit
                      </button>
                      <button onClick={() => remove(e._id)} style={{ background: '#e74c3c', color: "#fff" }}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>

          {totalPages > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", alignItems: "center", marginTop: 16 }}>
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                ← Prev
              </button>
              <span style={{ fontSize: 12, color: "#666" }}>
                Page {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
                Next →
              </button>
            </div>
          )}
        </>
      )}

      <MoodChart entries={entries} />
    </div>
  );
};

export default JournalPage;
