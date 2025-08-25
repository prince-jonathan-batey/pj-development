import 'dotenv/config';

import express from 'express';
import OpenAI from 'openai';
import protect from './authMiddleware.js';
import JournalEntry from './JournalEntry.js';

const router = express.Router();

if (!process.env.OPENAI_API_KEY) {
  console.warn('⚠️  OPENAI_API_KEY is not set. /journal/analyze will use local fallback.');
}
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Simple local sentiment-ish analyzer
function analyzeLocally(text) {
  const t = (text || '').toLowerCase();

  const buckets = {
    happy:    ['happy','grateful','excited','proud','joy','accomplished','calm','content'],
    sad:      ['sad','down','lonely','blue','depressed','heartbroken','upset'],
    anxious:  ['anxious','worried','nervous','panic','overthinking','uneasy','afraid'],
    stressed: ['stressed','overwhelmed','burnt','burned','pressure','tense','frustrated'],
    tired:    ['tired','exhausted','fatigued','sleepy','drained','worn out'],
  };

  let bestMood = 'neutral';
  let bestScore = 0;

  for (const [mood, keywords] of Object.entries(buckets)) {
    const score = keywords.reduce((acc, w) => acc + (t.includes(w) ? 1 : 0), 0);
    if (score > bestScore) {
      bestScore = score;
      bestMood = mood;
    }
  }

  const tips = {
    happy:   'Savor this moment—note one thing that made it special so you can revisit it later.',
    sad:     'It’s okay to feel heavy. Try a gentle check‑in: what’s one small kindness you can offer yourself tonight?',
    anxious: 'Your body is trying to protect you. Try box‑breathing (4‑4‑4‑4) for one minute and defer decisions until you’re calmer.',
    stressed:'Name the top 1–2 stressors and define a 10‑minute next step. Tiny progress reduces the load.',
    tired:   'Your energy is finite. Consider swapping one task for rest—future you will thank you.',
    neutral: 'A quick gratitude note or a 5‑minute walk can nudge your day in a good direction.',
  };

  return { mood: bestMood, insight: tips[bestMood] };
}

// CREATE (with local fallback for mood/insight)
router.post('/', protect, async (req, res) => {
  try {
    const { context, mood, insight } = req.body;
    if (!context || !context.trim()) {
      return res.status(400).json({ error: 'Context is required' });
    }

    let finalMood = mood;
    let finalInsight = insight;

    // If client didn’t analyze, derive locally
    if (!finalMood || !finalInsight) {
      const local = analyzeLocally(context);
      finalMood = finalMood || local.mood;
      finalInsight = finalInsight || local.insight;
    }

    const entry = new JournalEntry({ 
      user: req.user._id, 
      context: context.trim(), 
      mood: finalMood, 
      insight: finalInsight 
    });

    const saved = await entry.save();
    res.status(201).json({ message: 'Journal entry created successfully', entry: saved });
  } catch (error) {
    console.error('Error saving journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry' });
  }
});

// LIST
router.get('/', protect, async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page ?? '1', 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit ?? '10', 10), 1), 50);
    const skip = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      JournalEntry
        .find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      JournalEntry.countDocuments({ user: req.user._id })
    ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);
    res.json({ entries, page, total, totalPages });
  } catch (error) {
    console.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// UPDATE
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { context } = req.body;

    if (!context || !context.trim()) {
      return res.status(400).json({ error: 'Context is required' });
    }

    const updated = await JournalEntry.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { context: context.trim() },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Journal entry not found' });
    return res.json(updated);
  } catch (error) {
    console.error('Error updating journal entry:', error);
    res.status(500).json({ error: 'Failed to update journal entry' });
  }
});

// DELETE
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await JournalEntry.findOneAndDelete({ _id: id, user: req.user._id });
    if (!deleted) return res.status(404).json({ error: 'Journal entry not found' });
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting journal entry:', error);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// ANALYZE
router.post('/analyze', protect, async (req, res) => {
  try {
    const { context } = req.body;
    if (!context || !context.trim()) {
      return res.status(400).json({ error: 'Context is required for analysis' });
    }

    // No API key? Use local immediately
    if (!openai) {
      const local = analyzeLocally(context);
      return res.json({ insight: local.insight, mood: local.mood, source: 'local' });
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'You are a supportive AI mental wellness coach. Read the journal entry and respond with a short emotional insight in 1-2 sentences.'
          },
          { role: 'user', content: context },
        ],
        temperature: 0.7,
      });

      const insight = completion.choices?.[0]?.message?.content ?? 'No insight generated';
      // You can optionally try to infer mood here, but we’ll rely on client/server derivation if needed:
      const local = analyzeLocally(context);
      const mood = local.mood;

      return res.json({ insight, mood, source: 'openai' });
    } catch (err) {
      // Quota/rate or any failure → local fallback
      console.error('Analyze fallback (OpenAI):', err?.message || err);
      const local = analyzeLocally(context);
      return res.json({ insight: local.insight, mood: local.mood, source: 'local' });
    }
  } catch (error) {
    console.error('Error analyzing journal entry:', error);
    return res.status(500).json({ error: 'Failed to analyze journal entry' });
  }
});

export default router;
