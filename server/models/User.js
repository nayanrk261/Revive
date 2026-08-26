import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  accountType: {
    type: String,
    enum: ['individual', 'business'],
    default: 'business'
  },
  businessName: { type: String, default: '' },
  onboardingComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);
