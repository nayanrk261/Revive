import mongoose from 'mongoose';

const revenueEventSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  type: {
    type: String,
    enum: ['payment_failed', 'cart_abandoned', 'subscription_failed', 'invoice_overdue'],
    required: true
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
  failureReason: { type: String, default: null }, // e.g. "insufficient_balance", "bank_timeout", "card_expired", "otp_failed"
  dueDate: { type: Date, default: null },
  ageInHours: { type: Number, default: 0 },
  razorpayOrderId: { type: String, default: null },
  status: {
    type: String,
    enum: ['open', 'recovered', 'escalated', 'stopped'],
    default: 'open'
  }
}, { timestamps: true });

export const RevenueEvent = mongoose.model('RevenueEvent', revenueEventSchema);
