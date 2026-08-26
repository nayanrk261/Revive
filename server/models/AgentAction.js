import mongoose from 'mongoose';

const agentActionSchema = new mongoose.Schema({
  caseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecoveryCase',
    required: true
  },
  tool: { type: String, required: true },
  action: { type: String, required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  result: { type: String, default: 'success' }
}, { timestamps: true });

export const AgentAction = mongoose.model('AgentAction', agentActionSchema);
