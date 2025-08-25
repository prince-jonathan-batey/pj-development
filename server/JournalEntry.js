import mongoose from 'mongoose';

const journalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  context: { type: String, required: true },
  mode: { type: String },
  insight: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const JournalEntry = mongoose.model('JournalEntry', journalSchema);
export default JournalEntry;