import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { Customer } from '../models/Customer.js';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { AgentAction } from '../models/AgentAction.js';
import { Payment } from '../models/Payment.js';
import { calculateRiskScore } from '../services/riskEngine.js';

const FIRST_NAMES = ['Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Kabir', 'Siddharth', 'Meera', 'Aditya', 'Ishaan', 'Tanvi', 'Rahul', 'Kavya', 'Dev', 'Riya', 'Arjun', 'Pooja', 'Varun', 'Simran'];
const LAST_NAMES = ['Sharma', 'Verma', 'Gupta', 'Patel', 'Mehta', 'Singh', 'Reddy', 'Nair', 'Deshmukh', 'Chopra', 'Joshi', 'Bhasin', 'Kapoor', 'Rao', 'Iyer'];
const COMPANIES = ['NexGen Technologies', 'Kaveri Logistics', 'Vanguard Retail', 'Apex FinTech', 'Zenith Enterprises', 'Bharat Commerce', 'Starlight Media', 'Urban Pulse Solutions', 'BlueSky Systems', 'Saffron Creations'];

const FAILURE_REASONS = [
  'insufficient_balance',
  'bank_timeout',
  'card_expired',
  'otp_failed',
  'gateway_downtime'
];

export const seedDatabase = async () => {
  console.log('[SEED] Clearing existing collections...');
  await Customer.deleteMany({});
  await RevenueEvent.deleteMany({});
  await RecoveryCase.deleteMany({});
  await AgentAction.deleteMany({});
  await Payment.deleteMany({});

  console.log('[SEED] Creating ~70 customers...');
  const customers = [];

  for (let i = 0; i < 70; i++) {
    const isCompany = i % 5 === 0;
    const firstName = FIRST_NAMES[i % FIRST_NAMES.length];
    const lastName = LAST_NAMES[i % LAST_NAMES.length];
    const name = isCompany ? `${COMPANIES[i % COMPANIES.length]} (${firstName} ${lastName})` : `${firstName} ${lastName}`;
    const phone = `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;

    // Reliability tiers: High, Moderate, Chronic Late, New
    let totalPastEvents = 0;
    let lateCount = 0;
    let avgDaysToResolve = 2;
    let reliabilityScore = 0.85;

    if (i < 20) {
      // Highly reliable
      totalPastEvents = Math.floor(10 + Math.random() * 20);
      lateCount = Math.floor(Math.random() * 2);
      avgDaysToResolve = 1;
      reliabilityScore = 0.90 + Math.random() * 0.09;
    } else if (i < 45) {
      // Moderate
      totalPastEvents = Math.floor(5 + Math.random() * 15);
      lateCount = Math.floor(2 + Math.random() * 4);
      avgDaysToResolve = 4;
      reliabilityScore = 0.60 + Math.random() * 0.25;
    } else if (i < 62) {
      // Chronic late payer
      totalPastEvents = Math.floor(8 + Math.random() * 15);
      lateCount = Math.floor(totalPastEvents * (0.6 + Math.random() * 0.3));
      avgDaysToResolve = 12;
      reliabilityScore = 0.20 + Math.random() * 0.30;
    } else {
      // Brand new / unknown
      totalPastEvents = Math.floor(1 + Math.random() * 3);
      lateCount = 0;
      avgDaysToResolve = 3;
      reliabilityScore = 0.50;
    }

    customers.push({
      name,
      phone,
      email,
      paymentHistory: {
        totalPastEvents,
        lateCount,
        avgDaysToResolve,
        reliabilityScore: parseFloat(reliabilityScore.toFixed(2))
      }
    });
  }

  const createdCustomers = await Customer.insertMany(customers);
  console.log(`[SEED] Inserted ${createdCustomers.length} customers.`);

  console.log('[SEED] Creating ~160 RevenueEvents & RecoveryCases...');
  const events = [];

  const types = ['payment_failed', 'cart_abandoned', 'subscription_failed', 'invoice_overdue'];

  // Edge cases defined explicitly:
  // 1. High-value invoice from chronic late payer
  const chronicCustomer = createdCustomers.find(c => c.paymentHistory.reliabilityScore < 0.35);
  // 2. Small cart abandonment from reliable repeat customer
  const reliableCustomer = createdCustomers.find(c => c.paymentHistory.reliabilityScore > 0.90);
  // 3. Payment failure with no retry history
  const newCustomer = createdCustomers.find(c => c.paymentHistory.totalPastEvents <= 2);
  // 4. Subscription that's failed before
  const moderateCustomer = createdCustomers.find(c => c.paymentHistory.reliabilityScore >= 0.5 && c.paymentHistory.reliabilityScore <= 0.8);

  const edgeCases = [
    {
      type: 'invoice_overdue',
      customerId: chronicCustomer?._id || createdCustomers[0]._id,
      amount: 650000, // > 5 Lakhs
      createdAt: new Date(Date.now() - 14 * 24 * 3600 * 1000),
      dueDate: new Date(Date.now() - 10 * 24 * 3600 * 1000),
      ageInHours: 240,
      status: 'open',
      failureReason: null
    },
    {
      type: 'cart_abandoned',
      customerId: reliableCustomer?._id || createdCustomers[1]._id,
      amount: 1499,
      createdAt: new Date(Date.now() - 6 * 3600 * 1000),
      dueDate: null,
      ageInHours: 6,
      status: 'open',
      failureReason: null
    },
    {
      type: 'payment_failed',
      customerId: newCustomer?._id || createdCustomers[2]._id,
      amount: 12500,
      createdAt: new Date(Date.now() - 2 * 3600 * 1000),
      dueDate: null,
      ageInHours: 2,
      status: 'open',
      failureReason: 'insufficient_balance'
    },
    {
      type: 'subscription_failed',
      customerId: moderateCustomer?._id || createdCustomers[3]._id,
      amount: 4999,
      createdAt: new Date(Date.now() - 36 * 3600 * 1000),
      dueDate: null,
      ageInHours: 36,
      status: 'open',
      failureReason: 'card_expired'
    }
  ];

  events.push(...edgeCases);

  // Generate remaining ~156 revenue events
  for (let i = 0; i < 156; i++) {
    const cust = createdCustomers[i % createdCustomers.length];
    const type = types[i % types.length];

    let amount = 999;
    if (type === 'invoice_overdue') {
      amount = Math.floor(25000 + Math.random() * 450000);
    } else if (type === 'subscription_failed') {
      amount = Math.floor(1999 + Math.random() * 15000);
    } else if (type === 'payment_failed') {
      amount = Math.floor(1500 + Math.random() * 50000);
    } else { // cart_abandoned
      amount = Math.floor(499 + Math.random() * 8500);
    }

    const ageInHours = Math.floor(1 + Math.random() * 240); // 1 hr to 10 days
    const createdAt = new Date(Date.now() - ageInHours * 3600 * 1000);

    let dueDate = null;
    if (type === 'invoice_overdue') {
      dueDate = new Date(createdAt.getTime() + 7 * 24 * 3600 * 1000);
    }

    let failureReason = null;
    if (type === 'payment_failed' || type === 'subscription_failed') {
      failureReason = FAILURE_REASONS[Math.floor(Math.random() * FAILURE_REASONS.length)];
    }

    // Realistic distribution of open, recovered, escalated
    let status = 'open';
    const roll = Math.random();
    if (roll < 0.25) {
      status = 'recovered';
    } else if (roll < 0.35) {
      status = 'escalated';
    }

    events.push({
      type,
      customerId: cust._id,
      amount,
      createdAt,
      dueDate,
      ageInHours,
      failureReason,
      status
    });
  }

  const createdEvents = await RevenueEvent.insertMany(events);
  console.log(`[SEED] Inserted ${createdEvents.length} RevenueEvents.`);

  const recoveryCases = [];
  const initialActions = [];
  const payments = [];

  for (const ev of createdEvents) {
    const customer = createdCustomers.find(c => c._id.toString() === ev.customerId.toString());
    const { riskScore, riskLevel } = calculateRiskScore(ev, customer);

    const recProb = parseFloat(Math.max(0.1, Math.min(0.95, (1 - riskScore / 100) * (customer.paymentHistory.reliabilityScore || 0.7))).toFixed(2));

    const attempts = ev.status === 'open' ? (Math.random() < 0.4 ? 1 : 0) : (ev.status === 'recovered' ? 2 : 3);

    const recCase = {
      eventId: ev._id,
      customerId: ev.customerId,
      riskScore,
      riskLevel,
      recoveryProbability: recProb,
      recommendedAction: riskScore > 70 ? 'ESCALATE' : (ev.type === 'payment_failed' ? 'RETRY_PAYMENT' : 'SEND_REMINDER'),
      tone: riskScore > 70 ? 'firm' : (attempts > 0 ? 'medium' : 'soft'),
      channel: ev.type === 'invoice_overdue' ? 'email' : (Math.random() > 0.5 ? 'whatsapp' : 'sms'),
      attempts,
      lastActionAt: attempts > 0 ? new Date(Date.now() - Math.floor(Math.random() * 24) * 3600 * 1000) : null,
      promiseToPay: {
        exists: Math.random() < 0.15,
        promisedDate: new Date(Date.now() + 48 * 3600 * 1000),
        promisedAmount: ev.amount
      },
      status: ev.status
    };

    recoveryCases.push(recCase);
  }

  const createdCases = await RecoveryCase.insertMany(recoveryCases);
  console.log(`[SEED] Inserted ${createdCases.length} RecoveryCases.`);

  // Create initial AgentAction audit trails & Payment records for recovered ones
  for (const c of createdCases) {
    const ev = createdEvents.find(e => e._id.toString() === c.eventId.toString());

    if (c.attempts > 0) {
      initialActions.push({
        caseId: c._id,
        tool: 'get_event',
        action: 'FETCH_EVENT_DETAILS',
        reason: `Analyzed ${ev.type} of ₹${ev.amount.toLocaleString('en-IN')}. Age: ${ev.ageInHours}h. Risk level determined as ${c.riskLevel} (${c.riskScore}/100).`,
        timestamp: new Date(Date.now() - 12 * 3600 * 1000),
        result: 'success'
      });

      initialActions.push({
        caseId: c._id,
        tool: c.recommendedAction === 'RETRY_PAYMENT' ? 'retry_payment' : 'send_reminder',
        action: c.recommendedAction,
        reason: `Executed ${c.recommendedAction} on channel ${c.channel} with ${c.tone} tone. Recovery probability estimated at ${(c.recoveryProbability * 100).toFixed(0)}%.`,
        timestamp: new Date(Date.now() - 6 * 3600 * 1000),
        result: 'success'
      });
    }

    if (ev.status === 'recovered') {
      payments.push({
        eventId: ev._id,
        amount: ev.amount,
        receivedAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 3600 * 1000),
        method: ev.type === 'invoice_overdue' ? 'NEFT / Bank Transfer' : 'Razorpay UPI',
        status: 'success'
      });
    }
  }

  if (initialActions.length > 0) {
    await AgentAction.insertMany(initialActions);
  }
  if (payments.length > 0) {
    await Payment.insertMany(payments);
  }

  console.log(`[SEED] Seed completed successfully! Created ${createdCustomers.length} customers, ${createdEvents.length} events, ${createdCases.length} recovery cases, ${payments.length} payments.`);
};

// Executable if called directly
if (process.argv[1]?.endsWith('seedData.js')) {
  connectDB().then(async () => {
    await seedDatabase();
    process.exit(0);
  }).catch(err => {
    console.error('[SEED] Error seeding data:', err);
    process.exit(1);
  });
}
