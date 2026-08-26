import express from 'express';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { Customer } from '../models/Customer.js';
import { AgentAction } from '../models/AgentAction.js';
import { Payment } from '../models/Payment.js';
import { checkGuardrails } from '../services/guardrails.js';
import { executeToolCall } from '../services/agentTools.js';

const router = express.Router();

// GET /api/recovery/:caseId -> Full case details
router.get('/:caseId', async (req, res) => {
  try {
    const recCase = await RecoveryCase.findById(req.params.caseId)
      .populate('eventId')
      .populate('customerId');

    if (!recCase) {
      return res.status(404).json({ success: false, error: 'Case not found' });
    }

    const actions = await AgentAction.find({ caseId: recCase._id }).sort({ timestamp: -1 });
    const payments = await Payment.find({ eventId: recCase.eventId._id });

    res.json({
      success: true,
      case: recCase,
      actions,
      payments
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/recovery/:caseId/execute -> Execute recommended action with guardrail verification
router.post('/:caseId/execute', async (req, res) => {
  try {
    const recCase = await RecoveryCase.findById(req.params.caseId);
    if (!recCase) return res.status(404).json({ success: false, error: 'Case not found' });

    const event = await RevenueEvent.findById(recCase.eventId);
    const customer = await Customer.findById(recCase.customerId);

    const proposedAction = req.body.action || recCase.recommendedAction || 'SEND_REMINDER';

    // Guardrail evaluation before execution
    const guardrailCheck = await checkGuardrails(recCase, event, customer, proposedAction);

    if (!guardrailCheck.allowed) {
      // Log guardrail intervention
      await AgentAction.create({
        caseId: recCase._id,
        tool: 'backend_guardrails',
        action: `GUARDRAIL_OVERRIDE_${guardrailCheck.overriddenAction}`,
        reason: guardrailCheck.reason,
        result: 'vetoed'
      });

      // Update case if guardrail calls for state change
      if (guardrailCheck.overriddenAction === 'ESCALATE') {
        recCase.status = 'escalated';
        await recCase.save();
        await RevenueEvent.findByIdAndUpdate(event._id, { status: 'escalated' });
      } else if (guardrailCheck.overriddenAction === 'CLOSE') {
        recCase.status = 'stopped';
        await recCase.save();
        await RevenueEvent.findByIdAndUpdate(event._id, { status: 'stopped' });
      }

      return res.json({
        success: false,
        guardrailVeto: true,
        overriddenAction: guardrailCheck.overriddenAction,
        message: guardrailCheck.reason,
        case: recCase
      });
    }

    // Execute allowed action
    let result = null;
    if (proposedAction === 'RETRY_PAYMENT') {
      result = await executeToolCall('retry_payment', { eventId: event._id.toString() });
    } else if (proposedAction === 'ESCALATE') {
      result = await executeToolCall('escalate_case', { caseId: recCase._id.toString(), reason: 'Manual or agent triggered escalation' });
    } else if (proposedAction === 'CLOSE') {
      result = await executeToolCall('close_case', { caseId: recCase._id.toString(), reason: 'Case closed by operator decision' });
    } else {
      // Default: send reminder
      const tone = req.body.tone || recCase.tone || 'soft';
      const channel = req.body.channel || recCase.channel || 'whatsapp';
      result = await executeToolCall('send_reminder', { caseId: recCase._id.toString(), channel, tone });
    }

    const updatedCase = await RecoveryCase.findById(recCase._id).populate('eventId customerId');
    res.json({
      success: true,
      executedAction: proposedAction,
      result,
      case: updatedCase
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/recovery/:caseId/payment -> Simulate payment received
router.post('/:caseId/payment', async (req, res) => {
  try {
    const recCase = await RecoveryCase.findById(req.params.caseId);
    if (!recCase) return res.status(404).json({ success: false, error: 'Case not found' });

    const event = await RevenueEvent.findById(recCase.eventId);
    const amount = req.body.amount || event.amount;
    const method = req.body.method || (event.type === 'invoice_overdue' ? 'NEFT / Bank Transfer' : 'Razorpay UPI');

    // Create payment record
    const payment = await Payment.create({
      eventId: event._id,
      amount,
      receivedAt: new Date(),
      method,
      status: 'success'
    });

    // Update case & event status to recovered
    recCase.status = 'recovered';
    await recCase.save();

    event.status = 'recovered';
    await event.save();

    // Log action
    await AgentAction.create({
      caseId: recCase._id,
      tool: 'simulate_payment',
      action: 'PAYMENT_RECEIVED',
      reason: `Received full payment of ₹${amount.toLocaleString('en-IN')} via ${method}. Case successfully recovered!`,
      result: 'recovered'
    });

    // Update customer reliability history
    const customer = await Customer.findById(recCase.customerId);
    if (customer) {
      customer.paymentHistory.totalPastEvents += 1;
      customer.paymentHistory.reliabilityScore = Math.min(1.0, customer.paymentHistory.reliabilityScore + 0.05);
      await customer.save();
    }

    res.json({
      success: true,
      message: 'Payment received! Case marked as recovered.',
      payment,
      case: recCase
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/recovery/:caseId/escalate -> Manually escalate case
router.post('/:caseId/escalate', async (req, res) => {
  try {
    const recCase = await RecoveryCase.findById(req.params.caseId);
    if (!recCase) return res.status(404).json({ success: false, error: 'Case not found' });

    const reason = req.body.reason || 'Manually escalated by operator via dashboard';
    const result = await executeToolCall('escalate_case', { caseId: recCase._id.toString(), reason });

    const updatedCase = await RecoveryCase.findById(recCase._id).populate('eventId customerId');
    res.json({
      success: true,
      message: 'Case successfully escalated.',
      result,
      case: updatedCase
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/recovery/:caseId/activity -> Full audit trail of AgentAction
router.get('/:caseId/activity', async (req, res) => {
  try {
    const actions = await AgentAction.find({ caseId: req.params.caseId }).sort({ timestamp: -1 });
    res.json({
      success: true,
      count: actions.length,
      actions
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
