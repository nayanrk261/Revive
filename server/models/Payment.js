import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RevenueEvent',
    required: true
  },
  amount: { type: Number, required: true },
  receivedAt: { type: Date, default: Date.now },
  method: { type: String, default: 'UPI' },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  }
}, { timestamps: true });

export const Payment = mongoose.model('Payment', paymentSchema);
