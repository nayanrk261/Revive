import express from 'express';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { Payment } from '../models/Payment.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  try {
    const accountId = req.user ? req.user._id : null;
    const query = { accountId };

    const totalEventsCount = await RevenueEvent.countDocuments(query);
    const openCasesCount = await RecoveryCase.countDocuments({ ...query, status: 'open' });
    const recoveredCasesCount = await RecoveryCase.countDocuments({ ...query, status: 'recovered' });
    const escalatedCasesCount = await RecoveryCase.countDocuments({ ...query, status: 'escalated' });
    const stoppedCasesCount = await RecoveryCase.countDocuments({ ...query, status: 'stopped' });

    // Amounts
    const events = await RevenueEvent.find(query);
    let totalAtRiskAmount = 0;
    let totalOpenAmount = 0;
    let totalRecoveredAmount = 0;

    for (const ev of events) {
      totalAtRiskAmount += ev.amount || 0;
      if (ev.status === 'open') {
        totalOpenAmount += ev.amount || 0;
      } else if (ev.status === 'recovered') {
        totalRecoveredAmount += ev.amount || 0;
      }
    }

    const payments = await Payment.find({ ...query, status: 'success' });
    const actualPaymentsTotal = payments.reduce((acc, p) => acc + (p.amount || 0), 0);
    const finalRecoveredAmount = Math.max(totalRecoveredAmount, actualPaymentsTotal);

    const recoveryRatePct = totalEventsCount > 0 ? ((recoveredCasesCount / totalEventsCount) * 100).toFixed(1) : 0;

    // Type Breakdown
    const typeBreakdown = {
      payment_failed: await RevenueEvent.countDocuments({ ...query, type: 'payment_failed' }),
      cart_abandoned: await RevenueEvent.countDocuments({ ...query, type: 'cart_abandoned' }),
      subscription_failed: await RevenueEvent.countDocuments({ ...query, type: 'subscription_failed' }),
      invoice_overdue: await RevenueEvent.countDocuments({ ...query, type: 'invoice_overdue' })
    };

    // Funnel counts (Detected -> Diagnosed -> Contacted -> Recovered)
    const funnel = {
      detected: totalEventsCount,
      diagnosed: await RecoveryCase.countDocuments({ ...query, riskScore: { $exists: true } }),
      contacted: await RecoveryCase.countDocuments({ ...query, attempts: { $gt: 0 } }),
      recovered: recoveredCasesCount
    };

    res.json({
      success: true,
      metrics: {
        totalEventsCount,
        openCasesCount,
        recoveredCasesCount,
        escalatedCasesCount,
        stoppedCasesCount,
        totalAtRiskAmount,
        totalOpenAmount,
        totalRecoveredAmount: finalRecoveredAmount,
        recoveryRatePct: parseFloat(recoveryRatePct)
      },
      typeBreakdown,
      funnel
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
