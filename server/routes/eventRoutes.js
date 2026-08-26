import express from 'express';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type, status, limit = 100 } = req.query;

    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;

    const events = await RevenueEvent.find(query)
      .populate('customerId')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    // Attach matching recovery case to each event
    const eventIds = events.map(e => e._id);
    const cases = await RecoveryCase.find({ eventId: { $in: eventIds } });

    const caseMap = {};
    cases.forEach(c => {
      caseMap[c.eventId.toString()] = c;
    });

    const enrichedEvents = events.map(ev => ({
      ...ev.toObject(),
      case: caseMap[ev._id.toString()] || null
    }));

    res.json({
      success: true,
      count: enrichedEvents.length,
      events: enrichedEvents
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
