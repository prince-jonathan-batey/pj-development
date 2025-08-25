import dotenv from 'dotenv';
dotenv.config();

import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import OpenAI from 'openai';

import journalRoutes from './journalRoutes.js';
import authRoutes from './authRoutes.js';
import path from 'path';
import { fileURLToPath } from 'url';

import db from './db.js';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use('/auth', authRoutes);
app.use('/journal', journalRoutes);
// ========= Routes =========

// Health check
app.get('/health', (req, res) => {
  res.send('PJ Development API is running');
});

// Chat
app.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: message }],
    });
    res.json({ reply: response.choices[0].message.content });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Something went wrong with OpenAI' });
  }
});

if (process.env.NODE_ENV !== 'production') {
  const clientBuildPath = path.join(__dirname, '../client', 'build');
  app.use(express.static(clientBuildPath));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
}


// ========= Server Setup =========
const PORT = process.env.PORT || 5000;

mongoose.connection.on('connecting', () => console.log('🟡 MongoDB: connecting...'));
mongoose.connection.on('connected',  () => console.log('✅ MongoDB: connected'));
mongoose.connection.on('error',      (err) => console.error('❌ MongoDB error:', err));
mongoose.connection.on('disconnected', () => console.log('🔴 MongoDB: disconnected'));


mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 3000,
})
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

  app.get('/db-health', (req, res) => {
    res.json({ readyStates: mongoose.connection.readyState });
  });
