import React, { useEffect, useMemo,useState } from "react";
import { useAuth } from "../content/AuthContext";
import { listJournals } from "../api/journal";
import MoodChart from "../components/MoodChart";

const moods = ["happy", "neutral", "stressed" , "anxious", "tired", "sad"];

function daysBetween(a, b) {
  const A = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const B = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((B - A) / 8640000); // 1 day in milliseconds
}

export default function Dashboard() {
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await listJournals();
        setEntries(data);
      } catch (error) {
        console.error("Error fetching journal entries:", error);
        setLoading(false);
      }
    })();
  }, []);

  const { count, last30, streakDays, moodCounts } = useMemo(() => {
    const now = new Date();
    const last30 = entries.filter(e => {
      const d = new Date(e.createdAt);
      return daysBetween(d, now) <= 30;
    });

    const byDay = new Set(entries.map(e => new Date(e.createdAt).toDateString()));
    let streak = 0;
    let cur = 0;

    for (let i = 0; ; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      if (byDay.has(d.toDateString())) cur++;
      else {
        streak = cur;
        break;
      }
    }

    const moodCounts = moods.reduce((acc, m) => ({ ...acc, [m]: 0 }), {});

    for (const e of last30) {
      const m = (e.mood || "neutral").toLowerCase();
      if (moodCounts[m] !== undefined) moodCounts[m] += 1;
      else moodCounts["neutral"] += 1;
    }

    return { 
      count: entries.length, 
      last30, 
      streakDays: streak, 
      moodCounts 
    };
  }, [entries]);

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;

return (
    <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
      <h2>Welcome{user?.name ? `, ${user.name}` : ""} 👋</h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginTop: 12 }}>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Total Entries</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{count}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Active Streak (days)</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{streakDays}</div>
        </div>
        <div style={{ border: "1px solid #eee", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 12, color: "#666" }}>Last 30d Entries</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{last30.length}</div>
        </div>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Last 30 Days – Mood Trend</h3>
        {/* MoodChart already consumes entries; pass the last 30 days */}
        <MoodChart entries={last30} />
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Last 30 Days – Mood Breakdown</h3>
        <ul style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8, listStyle: "none", padding: 0 }}>
          {moods.map(m => (
            <li key={m} style={{ border: "1px solid #eee", borderRadius: 8, padding: 10 }}>
              <div style={{ textTransform: "capitalize" }}>{m}</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{moodCounts[m]}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}