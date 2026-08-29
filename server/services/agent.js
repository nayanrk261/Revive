import OpenAI from 'openai';
import { executeToolCall, toolsSchema } from './agentTools.js';
import { Customer } from '../models/Customer.js';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { AgentAction } from '../models/AgentAction.js';

let openaiClient = null;

export const getLLMProviderInfo = () => {
  if (process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'gsk_your_groq_api_key') {
    return { name: 'Groq', model: process.env.AI_MODEL || 'openai/gpt-oss-120b' };
  }
  if (process.env.OPENROUTER_API_KEY && process.env.OPENROUTER_API_KEY !== 'your_openrouter_key_if_using_openrouter') {
    return { name: 'OpenRouter', model: process.env.AI_MODEL || 'openai/gpt-4o-mini' };
  }
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_or_openrouter_key') {
    return { name: 'OpenAI', model: process.env.AI_MODEL || 'gpt-4o-mini' };
  }
  return { name: 'None — using heuristic fallback', model: null };
};

export const initOpenAIClient = () => {
  if (process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY) {
    const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || process.env.OPENROUTER_API_KEY;
    let baseURL;
    if (process.env.GROQ_API_KEY) baseURL = 'https://api.groq.com/openai/v1';
    else if (process.env.OPENROUTER_API_KEY) baseURL = 'https://openrouter.ai/api/v1';

    return new OpenAI({ apiKey, baseURL });
  }
  return null;
};

openaiClient = initOpenAIClient();

/**
 * Intelligent Multi-Step Agent Analysis Engine (Revive)
 */
export const runAgentAnalysis = async (caseId) => {
  const recCase = await RecoveryCase.findById(caseId);
  if (!recCase) throw new Error('RecoveryCase not found');

  const accountId = recCase.accountId || null;

  // Step 1: Execute initial tool calls (get_event, get_customer)
  const eventData = await executeToolCall('get_event', { eventId: recCase.eventId.toString() });
  const customerData = await executeToolCall('get_customer', { customerId: recCase.customerId.toString() });

  // Log audit action for tool calls
  await AgentAction.create({
    accountId,
    caseId: recCase._id,
    tool: 'get_event & get_customer',
    action: 'GATHER_CONTEXT',
    reason: `Fetched revenue event (${eventData.type}, ₹${eventData.amount}) and customer profile (${customerData.name}, reliability: ${customerData.paymentHistory?.reliabilityScore}).`,
    result: 'success'
  });

  // Step 2: Fetch history & prior attempts
  const historyData = await executeToolCall('get_payment_history', { customerId: recCase.customerId.toString() });
  const attemptsData = await executeToolCall('get_prior_attempts', { caseId: recCase._id.toString() });

  await AgentAction.create({
    accountId,
    caseId: recCase._id,
    tool: 'get_payment_history & get_prior_attempts',
    action: 'GATHER_HISTORY',
    reason: `Analyzed customer payment history (late ratio: ${customerData.paymentHistory?.lateCount}/${customerData.paymentHistory?.totalPastEvents}) and prior recovery attempts (${attemptsData.attemptsCount}).`,
    result: 'success'
  });

  let decisionResult = null;

  // Step 3: LLM or Intelligent Fallback reasoning loop
  if (!openaiClient) openaiClient = initOpenAIClient();

  if (openaiClient) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are Revive AI Revenue Recovery Agent. Analyze the revenue event and customer history data provided, and produce a structured JSON decision.
Available event types: payment_failed, cart_abandoned, subscription_failed, invoice_overdue.
Your task: Evaluate risk, calculate recovery probability (0.0 - 1.0), pick recommended action (SEND_REMINDER, RETRY_PAYMENT, ESCALATE, WAIT, CLOSE), select tone (soft, medium, firm), and select channel (sms, whatsapp, email, telegram).
You MUST provide a plain-language explanation in 'reason' referencing actual data values (amount, reliability, age, failure reason). Return ONLY JSON matching schema.`
        },
        {
          role: 'user',
          content: JSON.stringify({
            event: eventData,
            customer: customerData,
            history: historyData,
            attempts: attemptsData,
            currentRiskScore: recCase.riskScore
          })
        }
      ];

      const providerInfo = getLLMProviderInfo();
      const modelToUse = process.env.AI_MODEL || (process.env.GROQ_API_KEY ? 'openai/gpt-oss-120b' : (process.env.OPENROUTER_API_KEY ? 'openai/gpt-4o-mini' : 'gpt-4o-mini'));

      const response = await openaiClient.chat.completions.create({
        model: modelToUse,
        messages,
        response_format: { type: 'json_object' }
      });

      const rawContent = response.choices[0].message.content;
      let parsed = null;
      try {
        parsed = JSON.parse(rawContent);
      } catch (pErr) {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw pErr;
        }
      }

      const rawRisk = (parsed.risk || recCase.riskLevel || 'MEDIUM').toString().toUpperCase();
      const validRisk = ['LOW', 'MEDIUM', 'HIGH'].includes(rawRisk) ? rawRisk : recCase.riskLevel;
      let prob = recCase.recoveryProbability;
      if (parsed.recoveryProbability !== undefined) {
        let pVal = typeof parsed.recoveryProbability === 'number' ? parsed.recoveryProbability : parseFloat(parsed.recoveryProbability);
        if (!isNaN(pVal)) {
          if (pVal > 1) pVal = pVal / 100;
          prob = Math.max(0.01, Math.min(0.99, pVal));
        }
      }

      decisionResult = {
        risk: validRisk,
        recoveryProbability: prob,
        recommendedAction: parsed.recommendedAction || 'SEND_REMINDER',
        tone: (parsed.tone || 'soft').toLowerCase(),
        channel: (parsed.channel || 'whatsapp').toLowerCase(),
        reason: parsed.reason || 'AI agent analyzed history and event parameters.',
        shouldEscalate: parsed.shouldEscalate ?? (parsed.recommendedAction === 'ESCALATE')
      };
    } catch (llmErr) {
      console.warn('[AGENT] LLM call error, using intelligent heuristic agent:', llmErr.message);
    }
  }

  // Fallback / Baseline Intelligent Reasoning Agent
  if (!decisionResult) {
    const amount = eventData.amount || 0;
    const age = eventData.ageInHours || 0;
    const reliability = customerData.paymentHistory?.reliabilityScore ?? 0.7;
    const attempts = recCase.attempts || 0;
    const lateCount = customerData.paymentHistory?.lateCount || 0;

    let risk = recCase.riskLevel;
    let recProb = Math.max(0.1, Math.min(0.95, (1 - recCase.riskScore / 100) * (reliability + 0.1)));
    let recommendedAction = 'SEND_REMINDER';
    let tone = 'soft';
    let channel = eventData.type === 'invoice_overdue' ? 'email' : 'whatsapp';
    let reason = '';

    if (attempts === 0) {
      tone = 'soft';
    } else if (attempts === 1) {
      tone = 'medium';
    } else {
      tone = 'firm';
    }

    if (eventData.type === 'payment_failed') {
      if (attempts < 2 && eventData.failureReason !== 'card_expired') {
        recommendedAction = 'RETRY_PAYMENT';
        reason = `Payment failed due to ${eventData.failureReason || 'gateway error'}. Reliable customer (${(reliability * 100).toFixed(0)}% score). Recommending payment gateway retry link creation.`;
      } else if (attempts >= 2) {
        recommendedAction = 'ESCALATE';
        reason = `Payment attempt failed twice for order of ₹${amount.toLocaleString('en-IN')}. Escalating case for manual verification.`;
      } else {
        recommendedAction = 'SEND_REMINDER';
        reason = `Card expired for payment of ₹${amount.toLocaleString('en-IN')}. Sending soft notification to update card details.`;
      }
    } else if (eventData.type === 'cart_abandoned') {
      if (attempts < 2 && age < 48) {
        recommendedAction = 'SEND_REMINDER';
        channel = 'whatsapp';
        reason = `Cart abandoned ${age} hours ago worth ₹${amount.toLocaleString('en-IN')}. High customer reliability (${(reliability * 100).toFixed(0)}%). Sending ${tone} Hinglish nudge on WhatsApp.`;
      } else {
        recommendedAction = 'CLOSE';
        reason = `Cart abandoned over 48h ago with ${attempts} previous nudges. Closing case to avoid spamming customer.`;
      }
    } else if (eventData.type === 'subscription_failed') {
      if (age <= 48 && attempts < 2) {
        recommendedAction = 'SEND_REMINDER';
        channel = 'email';
        reason = `Subscription renewal of ₹${amount.toLocaleString('en-IN')} failed (${eventData.failureReason || 'bank declined'}). Sending ${tone} reminder during 48h grace period.`;
      } else {
        recommendedAction = 'ESCALATE';
        reason = `Subscription payment overdue by ${age} hours (${attempts} nudges sent). Escalating for account retention team intervention.`;
      }
    } else { // invoice_overdue
      if (amount > 500000 && attempts >= 2) {
        recommendedAction = 'ESCALATE';
        reason = `High-value B2B invoice (₹${amount.toLocaleString('en-IN')}) overdue by ${age} hours with chronic late payer history (${lateCount} late instances). Escalating to Account Director.`;
      } else if (attempts < 3) {
        recommendedAction = 'SEND_REMINDER';
        channel = 'email';
        reason = `B2B invoice #${eventData._id.toString().slice(-6)} of ₹${amount.toLocaleString('en-IN')} is overdue by ${age}h. Customer reliability: ${(reliability * 100).toFixed(0)}%. Sending ${tone} payment request.`;
      } else {
        recommendedAction = 'ESCALATE';
        reason = `Invoice #${eventData._id.toString().slice(-6)} reached max 3 reminder contacts. Escalating to finance collections.`;
      }
    }

    decisionResult = {
      risk,
      recoveryProbability: parseFloat(recProb.toFixed(2)),
      recommendedAction,
      tone,
      channel,
      reason,
      shouldEscalate: recommendedAction === 'ESCALATE'
    };
  }

  // Update case record with agent recommendations
  recCase.recommendedAction = decisionResult.recommendedAction;
  recCase.tone = decisionResult.tone;
  recCase.channel = decisionResult.channel;
  recCase.recoveryProbability = decisionResult.recoveryProbability;
  recCase.riskLevel = decisionResult.risk;
  await recCase.save();

  // Log final analysis action
  await AgentAction.create({
    accountId,
    caseId: recCase._id,
    tool: 'agent_analysis_loop',
    action: `RECOMMEND_${decisionResult.recommendedAction}`,
    reason: decisionResult.reason,
    result: 'success'
  });

  return decisionResult;
};
