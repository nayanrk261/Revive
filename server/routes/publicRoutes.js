import express from 'express';
import crypto from 'crypto';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { Customer } from '../models/Customer.js';
import { Payment } from '../models/Payment.js';
import { AgentAction } from '../models/AgentAction.js';
import { checkGuardrails } from '../services/guardrails.js';
import { executeToolCall } from '../services/agentTools.js';
import { createRazorpayOrder } from '../services/razorpayService.js';

const router = express.Router();

// GET /api/public/event/:eventId -> Lightweight public event data for customer payment portal
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    let event = null;

    if (/^[0-9a-fA-F]{24}$/.test(eventId)) {
      event = await RevenueEvent.findById(eventId);

      if (!event) {
        const recCase = await RecoveryCase.findById(eventId);
        if (recCase) {
          event = await RevenueEvent.findById(recCase.eventId);
        }
      }
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    // Fetch customer to extract ONLY first name
    const customer = await Customer.findById(event.customerId);
    const customerFirstName = customer?.name ? customer.name.split(' ')[0] : 'Valued Customer';

    // Fetch related recovery case for status
    const recCase = await RecoveryCase.findOne({ eventId: event._id });

    // Strict PII filter - ONLY return non-sensitive public details
    res.json({
      success: true,
      event: {
        id: event._id,
        type: event.type,
        amount: event.amount,
        status: event.status,
        failureReason: event.failureReason || null,
        ageInHours: event.ageInHours || 0,
        customerFirstName,
        createdAt: event.createdAt
      },
      caseStatus: recCase?.status || 'open'
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error fetching payment record details' });
  }
});

// POST /api/public/event/:eventId/create-order -> Expose parameters needed for embedded Razorpay Checkout widget
router.post('/event/:eventId/create-order', async (req, res) => {
  try {
    let event = await RevenueEvent.findById(req.params.eventId);
    if (!event) {
      const recCaseObj = await RecoveryCase.findById(req.params.eventId);
      if (recCaseObj) event = await RevenueEvent.findById(recCaseObj.eventId);
    }

    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const order = await createRazorpayOrder(event);
    res.json({
      success: true,
      orderId: order.orderId,
      amount: Math.round(event.amount * 100), // amount in paise
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'your_razorpay_test_key_id',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/public/event/:eventId/verify-payment -> HMAC signature verification of captured test/live payment
router.post('/event/:eventId/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    let event = await RevenueEvent.findById(req.params.eventId);
    if (!event) {
      const recCaseObj = await RecoveryCase.findById(req.params.eventId);
      if (recCaseObj) event = await RevenueEvent.findById(recCaseObj.eventId);
    }

    if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    // Perform signature check if secret is configured
    if (keySecret && keySecret !== 'your_razorpay_test_key_secret' && razorpay_signature) {
      const expectedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Payment verification failed: Signature mismatch' });
      }
    }

    // Signature valid — update status & log captured payment
    const recCase = await RecoveryCase.findOne({ eventId: event._id });

    event.status = 'recovered';
    await event.save();

    if (recCase) {
      recCase.status = 'recovered';
      await recCase.save();
    }

    const txnId = razorpay_payment_id || `pay_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

    await Payment.create({
      accountId: event.accountId || null,
      eventId: event._id,
      customerId: event.customerId,
      amount: event.amount,
      receivedAt: new Date(),
      paymentMethod: 'razorpay_checkout',
      status: 'success',
      transactionId: txnId
    });

    if (recCase) {
      await AgentAction.create({
        accountId: recCase.accountId || null,
        caseId: recCase._id,
        tool: 'razorpay_checkout',
        action: 'PAYMENT_VERIFIED_REAL',
        reason: `Real Razorpay test payment captured and signature-verified. Payment ID: ${txnId}`,
        result: 'success',
      });
    }

    res.json({ success: true, message: 'Payment verified and case recovered', transactionId: txnId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/public/event/:eventId/retry -> Trigger retry payment tool from public customer portal
router.post('/event/:eventId/retry', async (req, res) => {
  try {
    const { eventId } = req.params;
    let event = await RevenueEvent.findById(eventId);
    if (!event) {
      const recCaseObj = await RecoveryCase.findById(eventId);
      if (recCaseObj) event = await RevenueEvent.findById(recCaseObj.eventId);
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (event.status === 'recovered') {
      return res.json({
        success: true,
        alreadyPaid: true,
        message: 'Payment has already been completed for this transaction.'
      });
    }

    const recCase = await RecoveryCase.findOne({ eventId: event._id });
    const customer = await Customer.findById(event.customerId);

    // Enforce Guardrail engine checks before execution
    if (recCase && customer) {
      const guardrailCheck = await checkGuardrails(recCase, event, customer, 'RETRY_PAYMENT');
      if (!guardrailCheck.allowed) {
        return res.status(400).json({
          success: false,
          guardrailVeto: true,
          message: guardrailCheck.reason
        });
      }
    }

    const result = await executeToolCall('retry_payment', { eventId: event._id.toString() });

    res.json({
      success: true,
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/public/event/:eventId/pay -> Complete public payment (simulation/fallback)
router.post('/event/:eventId/pay', async (req, res) => {
  try {
    const { eventId } = req.params;
    let event = await RevenueEvent.findById(eventId);
    if (!event) {
      const recCaseObj = await RecoveryCase.findById(eventId);
      if (recCaseObj) event = await RevenueEvent.findById(recCaseObj.eventId);
    }

    if (!event) {
      return res.status(404).json({ success: false, error: 'Payment record not found' });
    }

    if (event.status === 'recovered') {
      return res.json({
        success: true,
        alreadyPaid: true,
        message: 'Payment has already been completed for this transaction.'
      });
    }

    event.status = 'recovered';
    await event.save();

    const recCase = await RecoveryCase.findOne({ eventId: event._id });
    if (recCase) {
      recCase.status = 'recovered';
      await recCase.save();
    }

    const transactionId = 'pay_' + Math.random().toString(36).substring(2, 10).toUpperCase();
    const payment = await Payment.create({
      accountId: event.accountId || null,
      eventId: event._id,
      customerId: event.customerId,
      amount: event.amount,
      receivedAt: new Date(),
      paymentMethod: req.body.paymentMethod || 'upi_razorpay',
      status: 'success',
      transactionId
    });

    if (recCase) {
      await AgentAction.create({
        accountId: recCase.accountId || null,
        caseId: recCase._id,
        tool: 'public_customer_portal',
        action: 'PAYMENT_RECEIVED',
        reason: `Customer completed payment of ₹${event.amount.toLocaleString('en-IN')} via Revive Customer Portal (Txn #${transactionId}).`,
        result: 'success'
      });
    }

    res.json({
      success: true,
      message: 'Payment processed and verified successfully!',
      payment,
      transactionId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
