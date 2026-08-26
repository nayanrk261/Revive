import express from 'express';
import { runAgentAnalysis } from '../services/agent.js';
import { compareBaselineAndAgent } from '../services/comparisonEngine.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { Customer } from '../models/Customer.js';
import { executeToolCall } from '../services/agentTools.js';
import { checkGuardrails } from '../services/guardrails.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/agent/analyze/:caseId -> Run the agent analysis loop on a case
router.post('/analyze/:caseId', requireAuth, async (req, res) => {
  try {
    const analysis = await runAgentAnalysis(req.params.caseId);
    const updatedCase = await RecoveryCase.findById(req.params.caseId)
      .populate('eventId')
      .populate('customerId');

    res.json({
      success: true,
      analysis,
      case: updatedCase
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agent/process-batch -> Process open cases in batch for current account
router.post('/process-batch', requireAuth, async (req, res) => {
  try {
    const accountId = req.user ? req.user._id : null;
    const openCases = await RecoveryCase.find({ accountId, status: 'open' }).limit(50);
    const results = [];

    for (const c of openCases) {
      try {
        const analysis = await runAgentAnalysis(c._id.toString());

        const event = await RevenueEvent.findById(c.eventId);
        const customer = await Customer.findById(c.customerId);
        const guardrail = await checkGuardrails(c, event, customer, analysis.recommendedAction);

        let status = 'open';
        let actionResult = null;

        if (guardrail.allowed) {
          if (analysis.recommendedAction === 'RETRY_PAYMENT') {
            actionResult = await executeToolCall('retry_payment', { eventId: event._id.toString() });
          } else if (analysis.recommendedAction === 'ESCALATE') {
            actionResult = await executeToolCall('escalate_case', { caseId: c._id.toString(), reason: analysis.reason });
            status = 'escalated';
          } else if (analysis.recommendedAction === 'CLOSE') {
            actionResult = await executeToolCall('close_case', { caseId: c._id.toString(), reason: analysis.reason });
            status = 'stopped';
          } else {
            actionResult = await executeToolCall('send_reminder', {
              caseId: c._id.toString(),
              channel: analysis.channel || 'whatsapp',
              tone: analysis.tone || 'soft'
            });
          }
        } else {
          actionResult = { guardrailVeto: true, reason: guardrail.reason };
        }

        results.push({
          caseId: c._id,
          recommendedAction: analysis.recommendedAction,
          reason: analysis.reason,
          status,
          actionResult
        });
      } catch (caseErr) {
        results.push({ caseId: c._id, error: caseErr.message });
      }
    }

    res.json({
      success: true,
      processedCount: results.length,
      results
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/agent/compare-baseline -> Run baseline vs agent comparison engine
router.post('/compare-baseline', requireAuth, async (req, res) => {
  try {
    const accountId = req.user ? req.user._id : null;
    const comparison = await compareBaselineAndAgent(accountId);
    res.json({
      success: true,
      comparison
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
