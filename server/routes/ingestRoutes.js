import express from 'express';
import OpenAI from 'openai';
import { Customer } from '../models/Customer.js';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { AgentAction } from '../models/AgentAction.js';
import { calculateRiskScore } from '../services/riskEngine.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

let openaiClient = null;

if (process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const baseURL = process.env.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1' : undefined;
  openaiClient = new OpenAI({ apiKey, baseURL });
}

// Helper to fallback-parse raw text or CSV if LLM is unavailable
const fallbackParseRawText = (rawText) => {
  const lines = rawText.split('\n').filter(l => l.trim().length > 0);
  const events = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.toLowerCase().includes('customer') && line.toLowerCase().includes('amount')) continue; // Skip CSV header

    const parts = line.includes(',') ? line.split(',') : line.split(/\s+/);
    let name = parts[0]?.trim() || `Customer ${i + 1}`;
    let amount = parseFloat(parts.find(p => !isNaN(parseFloat(p)) && parseFloat(p) > 10) || 5000);
    
    let type = 'invoice_overdue';
    if (line.toLowerCase().includes('failed') || line.toLowerCase().includes('declined')) {
      type = 'payment_failed';
    } else if (line.toLowerCase().includes('cart') || line.toLowerCase().includes('abandon')) {
      type = 'cart_abandoned';
    } else if (line.toLowerCase().includes('sub') || line.toLowerCase().includes('renew')) {
      type = 'subscription_failed';
    }

    events.push({
      type,
      customerName: name,
      customerPhone: `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
      customerEmail: `${name.toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
      amount,
      failureReason: type === 'payment_failed' ? 'insufficient_balance' : null,
      ageInHours: Math.floor(12 + Math.random() * 120)
    });
  }

  return events;
};

// POST /api/ingest/upload
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const { rawText } = req.body;

    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ success: false, error: 'Raw text or CSV content is required for ingestion.' });
    }

    const accountId = req.user ? req.user._id : null;
    let extractedEvents = [];

    if (openaiClient) {
      try {
        const response = await openaiClient.chat.completions.create({
          model: process.env.AI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are Revive Data Extraction Agent. Extract revenue events from raw text or CSV data.
For each record found, extract:
- type: 'payment_failed' | 'cart_abandoned' | 'subscription_failed' | 'invoice_overdue'
- customerName: string
- customerPhone: string (optional, format +91...)
- customerEmail: string (optional)
- amount: number
- failureReason: string or null
- ageInHours: number (default 24 if missing)
Return JSON object: { "events": [ { "type": "...", "customerName": "...", "amount": 1000, ... } ] }`
            },
            {
              role: 'user',
              content: rawText
            }
          ],
          response_format: { type: 'json_object' }
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        extractedEvents = parsed.events || [];
      } catch (llmErr) {
        console.warn('[INGEST] LLM extraction error, using fallback parser:', llmErr.message);
        extractedEvents = fallbackParseRawText(rawText);
      }
    } else {
      extractedEvents = fallbackParseRawText(rawText);
    }

    if (extractedEvents.length === 0) {
      return res.status(400).json({ success: false, error: 'Could not extract any valid revenue events from provided data.' });
    }

    let customersCreatedCount = 0;
    let totalAtRisk = 0;
    const createdCases = [];

    for (const item of extractedEvents) {
      const amount = Math.abs(parseFloat(item.amount) || 2500);
      totalAtRisk += amount;

      // Find or create customer
      let customer = await Customer.findOne({
        name: item.customerName,
        accountId
      });

      if (!customer) {
        customer = await Customer.create({
          accountId,
          name: item.customerName || 'Ingested Customer',
          phone: item.customerPhone || `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
          email: item.customerEmail || `${(item.customerName || 'customer').toLowerCase().replace(/[^a-z]/g, '')}@example.com`,
          paymentHistory: {
            totalPastEvents: Math.floor(1 + Math.random() * 5),
            lateCount: Math.floor(Math.random() * 2),
            avgDaysToResolve: 3,
            reliabilityScore: 0.70
          }
        });
        customersCreatedCount += 1;
      }

      // Create RevenueEvent
      const event = await RevenueEvent.create({
        accountId,
        type: item.type || 'invoice_overdue',
        customerId: customer._id,
        amount,
        createdAt: new Date(Date.now() - (item.ageInHours || 24) * 3600 * 1000),
        dueDate: item.type === 'invoice_overdue' ? new Date() : null,
        ageInHours: item.ageInHours || 24,
        failureReason: item.failureReason || null,
        status: 'open'
      });

      // Calculate Risk Score and create RecoveryCase
      const { riskScore, riskLevel } = calculateRiskScore(event, customer);
      const recCase = await RecoveryCase.create({
        accountId,
        eventId: event._id,
        customerId: customer._id,
        riskScore,
        riskLevel,
        recoveryProbability: parseFloat(Math.max(0.2, (1 - riskScore / 100)).toFixed(2)),
        recommendedAction: riskScore > 70 ? 'ESCALATE' : (event.type === 'payment_failed' ? 'RETRY_PAYMENT' : 'SEND_REMINDER'),
        tone: riskScore > 70 ? 'firm' : 'soft',
        channel: event.type === 'invoice_overdue' ? 'email' : 'whatsapp',
        attempts: 0,
        status: 'open'
      });

      // Log action audit
      await AgentAction.create({
        accountId,
        caseId: recCase._id,
        tool: 'ingestion_parser',
        action: 'DATA_INGESTED',
        reason: `Successfully ingested ${event.type} event of ₹${amount.toLocaleString('en-IN')} for ${customer.name}. Pre-scored risk: ${riskLevel} (${riskScore}/100).`,
        result: 'success'
      });

      createdCases.push(recCase._id);
    }

    res.status(201).json({
      success: true,
      recordsFound: extractedEvents.length,
      customersCreated: customersCreatedCount,
      totalAtRisk,
      createdCaseIds: createdCases,
      message: `Successfully processed ${extractedEvents.length} records into Revive pipeline!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
