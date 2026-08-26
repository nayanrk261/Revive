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
import { seedDatabase } from './seed/seedData.js';
import { RevenueEvent } from './models/RevenueEvent.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/ingest', ingestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/recovery', recoveryRoutes);
app.use('/api/agent', agentRoutes);

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
  });
};

startServer().catch(err => {
  console.error('[SERVER] Fatal startup error:', err);
});
