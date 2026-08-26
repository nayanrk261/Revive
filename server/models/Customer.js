import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
  accountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  paymentHistory: {
    totalPastEvents: { type: Number, default: 0 },
    lateCount: { type: Number, default: 0 },
    avgDaysToResolve: { type: Number, default: 0 },
    reliabilityScore: { type: Number, default: 1.0 } // 0 - 1
  }
}, { timestamps: true });

export const Customer = mongoose.model('Customer', customerSchema);
