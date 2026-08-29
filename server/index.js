import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import ingestRoutes from './routes/ingestRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import recoveryRoutes from './routes/recoveryRoutes.js';
import agentRoutes from './routes/agentRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import { seedDatabase } from './seed/seedData.js';
import { RevenueEvent } from './models/RevenueEvent.js';

import { getLLMProviderInfo } from './services/agent.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

const clientUrl = process.env.CLIENT_URL;
app.use(cors({
  origin: clientUrl ? [clientUrl, 'http://localhost:5173', 'http://localhost:3000', 'http://localhost:5005'] : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/public', publicRoutes);

// Seed API endpoint for instant reset / re-seeding from UI
app.post('/api/seed', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database successfully re-seeded with synthetic revenue data!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Revive - AI Revenue Recovery Agent', timestamp: new Date() });
});

// Initialize DB and start server
const startServer = async () => {
  await connectDB();

  // Auto-seed if database is empty
  const count = await RevenueEvent.countDocuments({ accountId: null });
  if (count === 0) {
    console.log('[INIT] Demo database is empty. Running initial synthetic seed...');
    await seedDatabase();
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Revive AI Backend running on http://localhost:${PORT}`);

    const llmInfo = getLLMProviderInfo();
    console.log(`[CONFIG] LLM Provider: ${llmInfo.name}${llmInfo.model ? ` (Model: ${llmInfo.model})` : ''}`);

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpConfigured = Boolean(smtpUser && smtpPass && smtpUser !== 'your_email@gmail.com' && smtpPass !== 'your_gmail_app_password');

    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const tgChat = process.env.TELEGRAM_CHAT_ID;
    const telegramConfigured = Boolean(tgToken && tgChat && tgToken !== 'your_bot_token_from_botfather');

    console.log(`[CONFIG] SMTP Email: ${smtpConfigured ? `CONFIGURED (${smtpUser})` : 'NOT CONFIGURED — real email sends will fail until valid credentials are added to server/.env'}`);
    console.log(`[CONFIG] Telegram Bot: ${telegramConfigured ? 'CONFIGURED (Bot Token & Chat ID active)' : 'NOT CONFIGURED — Telegram sends will fail until token/chat ID are set in server/.env'}`);
  });
};

startServer().catch(err => {
  console.error('[SERVER] Fatal startup error:', err);
});
