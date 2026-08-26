/**
 * Deterministic Risk Engine
 * Computes riskScore (0-100) and riskLevel ("LOW" | "MEDIUM" | "HIGH")
 * Also provides baseline evaluation rule for comparison.
 */

const MAX_AMOUNT_SCALE = 500000; // Rs 5,00,000 for normalization
const MAX_AGE_SCALE = 720;      // 30 days (720 hrs) for normalization

const TYPE_WEIGHTS = {
  invoice_overdue: 1.2,
  subscription_failed: 1.0,
  payment_failed: 0.8,
  cart_abandoned: 0.6
};

export const calculateRiskScore = (event, customer) => {
  // 1. Amount factor (0 - 1)
  const normAmount = Math.min(1.0, (event.amount || 0) / MAX_AMOUNT_SCALE);

  // 2. Age factor (0 - 1)
  const normAge = Math.min(1.0, (event.ageInHours || 0) / MAX_AGE_SCALE);

  // 3. Customer late ratio factor (0 - 1)
  const totalEvents = customer?.paymentHistory?.totalPastEvents || 0;
  const lateCount = customer?.paymentHistory?.lateCount || 0;
  const lateRatio = totalEvents > 0 ? (lateCount / totalEvents) : 0.3; // Default 0.3 if brand new

  // 4. Reliability penalty (1 - reliabilityScore)
  const reliability = customer?.paymentHistory?.reliabilityScore ?? 0.7;
  const unreliability = 1 - reliability;

  // 5. Event type weight (0.6 - 1.2)
  const typeWeight = TYPE_WEIGHTS[event.type] || 0.8;

  // Weighted raw sum (0.0 to ~1.0)
  const rawScore = (
    normAmount * 0.30 +
    normAge * 0.25 +
    lateRatio * 0.25 +
    unreliability * 0.20
  ) * typeWeight;

  // Scale to 0 - 100 range and clamp
  const score = Math.min(100, Math.max(0, Math.round(rawScore * 100)));

  let level = 'LOW';
  if (score > 70) {
    level = 'HIGH';
  } else if (score > 40) {
    level = 'MEDIUM';
  }

  return { riskScore: score, riskLevel: level };
};

/**
 * Rules-only baseline evaluation (for comparison in Section 9)
 * Baseline rule: if riskScore > 70 -> escalate immediately, else -> send one generic reminder, no follow-up
 */
export const evaluateRulesBaseline = (riskScore, attempts = 0) => {
  if (riskScore > 70) {
    return {
      action: 'ESCALATE',
      reason: 'Rules-only baseline: Risk score exceeds 70 -> Immediate escalation trigger.'
    };
  }

  if (attempts >= 1) {
    return {
      action: 'STOP',
      reason: 'Rules-only baseline: Max 1 reminder limit reached with no intelligent follow-up.'
    };
  }

  return {
    action: 'SEND_REMINDER',
    reason: 'Rules-only baseline: Standard single generic reminder.'
  };
};
