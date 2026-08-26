import mongoose from 'mongoose';

const recoveryCaseSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RevenueEvent',
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  riskScore: { type: Number, required: true, default: 50 }, // 0 - 100
  riskLevel: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM'
  },
  recoveryProbability: { type: Number, default: 0.5 }, // 0.0 - 1.0
  recommendedAction: {
    type: String,
    enum: ['SEND_REMINDER', 'RETRY_PAYMENT', 'ESCALATE', 'WAIT', 'CLOSE'],
    default: 'SEND_REMINDER'
  },
  tone: { type: String, enum: ['soft', 'medium', 'firm'], default: 'soft' },
  channel: { type: String, enum: ['sms', 'whatsapp', 'email'], default: 'whatsapp' },
  attempts: { type: Number, default: 0 },
  lastActionAt: { type: Date, default: null },
  promiseToPay: {
    exists: { type: Boolean, default: false },
    promisedDate: { type: Date, default: null },
    promisedAmount: { type: Number, default: 0 }
  },
  status: {
    type: String,
    enum: ['open', 'recovered', 'escalated', 'stopped'],
    default: 'open'
  }
}, { timestamps: true });

export const RecoveryCase = mongoose.model('RecoveryCase', recoveryCaseSchema);
