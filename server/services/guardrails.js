import { Payment } from '../models/Payment.js';
import { AgentAction } from '../models/AgentAction.js';

/**
 * Backend Guardrails Engine (Final Veto Power)
 * Enforces business rules & stopping rules BEFORE action execution.
 */
export const checkGuardrails = async (recCase, event, customer, proposedAction) => {
  const currentHour = new Date().getHours();
  // Quiet hours check: 8am - 9pm allowed (8 to 21)
  const isQuietHours = currentHour < 8 || currentHour >= 21;

  // 1. Payment check: Stop immediately if payment received
  const existingPayment = await Payment.findOne({ eventId: event._id, status: 'success' });
  if (existingPayment || event.status === 'recovered') {
    return {
      allowed: false,
      overriddenAction: 'CLOSE',
      reason: 'Guardrail trigger: Payment has already been received. Stopping all recovery actions.'
    };
  }

  // 2. Promise to Pay check: Do not nudge if active promiseToPay is pending & not past due
  if (recCase.promiseToPay && recCase.promiseToPay.exists && recCase.promiseToPay.promisedDate) {
    const promisedTime = new Date(recCase.promiseToPay.promisedDate).getTime();
    const now = Date.now();
    if (now < promisedTime && proposedAction === 'SEND_REMINDER') {
      return {
        allowed: false,
        overriddenAction: 'WAIT',
        reason: `Guardrail trigger: Active Promise-to-Pay pending until ${new Date(promisedTime).toLocaleDateString('en-IN')}. Suppressing reminder.`
      };
    }
  }

  // 3. Quiet Hours check (for reminders)
  if (proposedAction === 'SEND_REMINDER' && isQuietHours) {
    return {
      allowed: false,
      overriddenAction: 'WAIT',
      reason: `Guardrail trigger: Current time (${currentHour}:00) is within quiet hours (9 PM - 8 AM). Delaying reminder dispatch.`
    };
  }

  // 4. Type-specific guardrail rules
  if (event.type === 'payment_failed') {
    if (recCase.attempts >= 3) {
      return {
        allowed: false,
        overriddenAction: 'ESCALATE',
        reason: 'Guardrail trigger (payment_failed): Maximum 3 payment retries reached. Escalating for manual review.'
      };
    }
  }

  if (event.type === 'cart_abandoned') {
    if (recCase.attempts >= 2) {
      return {
        allowed: false,
        overriddenAction: 'CLOSE',
        reason: 'Guardrail trigger (cart_abandoned): Maximum 2 nudges within 48 hours reached. Stopping recovery campaign.'
      };
    }
  }

  if (event.type === 'subscription_failed') {
    // Grace period check (24-48h grace)
    if (event.ageInHours > 48 && recCase.attempts >= 2) {
      return {
        allowed: false,
        overriddenAction: 'ESCALATE',
        reason: 'Guardrail trigger (subscription_failed): Subscription grace period (48h) exceeded with 2 failed attempts. Escalating case.'
      };
    }
  }

  if (event.type === 'invoice_overdue') {
    // Overdue threshold check: amount > Rs 5,00,000 and 2 reminders failed -> auto escalate
    if (event.amount > 500000 && recCase.attempts >= 2) {
      return {
        allowed: false,
        overriddenAction: 'ESCALATE',
        reason: 'Guardrail trigger (invoice_overdue): High-value invoice (> ₹5,00,000) with 2 failed reminders. Auto-escalating to Senior Account Manager.'
      };
    }

    if (recCase.attempts >= 3) {
      return {
        allowed: false,
        overriddenAction: 'ESCALATE',
        reason: 'Guardrail trigger (invoice_overdue): Maximum 3 reminders reached for overdue B2B invoice. Escalating to collections team.'
      };
    }
  }

  // If no guardrail violated, allow action
  return { allowed: true };
};
