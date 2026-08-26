import { Customer } from '../models/Customer.js';
import { RevenueEvent } from '../models/RevenueEvent.js';
import { RecoveryCase } from '../models/RecoveryCase.js';
import { AgentAction } from '../models/AgentAction.js';
import { Payment } from '../models/Payment.js';
import { createRazorpayOrder, checkRazorpayPaymentStatus } from './razorpayService.js';
import { sendEmailReminder } from './mailService.js';

/**
 * Hinglish Message Generator based on tone & type (Revive Branded)
 */
export const generateHinglishMessage = (event, customer, tone = 'soft') => {
  const name = customer.name.split(' ')[0] || 'Customer';
  const amountStr = `₹${event.amount.toLocaleString('en-IN')}`;

  if (event.type === 'payment_failed') {
    if (tone === 'soft') {
      return `Arre ${name}, aapka ${amountStr} ka payment complete nahi ho paaya — koi baat nahi, aap is link se 30 second mein phir try kar lo: https://pay.revive.in/pay/${event._id}`;
    } else if (tone === 'medium') {
      return `Hi ${name}, aapka ${amountStr} ka payment abhi bhi incomplete status par hai. Gateway attempt retry kar ke order confirm kijiye: https://pay.revive.in/pay/${event._id}`;
    } else {
      return `Important: Payment of ${amountStr} for order #${event._id.toString().slice(-6)} failed. Please complete transaction immediately to prevent auto-cancellation. Link: https://pay.revive.in/pay/${event._id}`;
    }
  }

  if (event.type === 'cart_abandoned') {
    if (tone === 'soft') {
      return `Namaste ${name}! Aapka cart mein ${amountStr} worth items pending hain. Stock khatam hone se pehle check out kar lijiye! Link: https://store.revive.in/cart/${event._id}`;
    } else if (tone === 'medium') {
      return `Aapka cart wait kar raha hai, ${name}! Complete your purchase of ${amountStr} with extra 5% instant discount now: https://store.revive.in/cart/${event._id}`;
    } else {
      return `Alert: Items in your cart worth ${amountStr} will be released back to inventory in 2 hours. Secure them now: https://store.revive.in/cart/${event._id}`;
    }
  }

  if (event.type === 'subscription_failed') {
    if (tone === 'soft') {
      return `Hi ${name}, aapka plan renewal payment ${amountStr} process nahi ho paya. Services active rakhne ke liye payment method update kar lijiye: https://revive.in/subs/${event._id}`;
    } else if (tone === 'medium') {
      return `Aapka subscription renewal of ${amountStr} pending hai. Next 24 hours mein uninterrupted access ke liye bill clear kijiye: https://revive.in/subs/${event._id}`;
    } else {
      return `Urgent Notice: Account subscription payment of ${amountStr} is past grace period. Account access will be paused shortly unless resolved: https://revive.in/subs/${event._id}`;
    }
  }

  // invoice_overdue
  if (tone === 'soft') {
    return `Namaste ${name}, invoice for ${amountStr} is due. Kripya verification aur payment schedule double check kar lijiye. Details: https://revive.in/inv/${event._id}`;
  } else if (tone === 'medium') {
    return `Reminder: Invoice #${event._id.toString().slice(-6)} of ${amountStr} is currently overdue by ${event.ageInHours} hours. Please remit payment via bank transfer/UPI today.`;
  } else {
    return `Formal Notice: Invoice #${event._id.toString().slice(-6)} of ${amountStr} is severely overdue (${event.ageInHours}h past due date). Please clear receivables immediately to prevent service suspension.`;
  }
};

/**
 * Tool Definitions & Handlers
 */
export const toolsSchema = [
  {
    type: 'function',
    function: {
      name: 'get_customer',
      description: 'Fetch customer details and payment history profile',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'MongoDB ObjectId of customer' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_event',
      description: 'Fetch revenue event details including type, amount, age in hours, and failure reason',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string', description: 'MongoDB ObjectId of revenue event' }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_payment_history',
      description: 'Fetch past payments and reliability history of customer',
      parameters: {
        type: 'object',
        properties: {
          customerId: { type: 'string', description: 'MongoDB ObjectId of customer' }
        },
        required: ['customerId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_prior_attempts',
      description: 'Fetch prior agent recovery attempts and audit log for a case',
      parameters: {
        type: 'object',
        properties: {
          caseId: { type: 'string', description: 'MongoDB ObjectId of recovery case' }
        },
        required: ['caseId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'send_reminder',
      description: 'Send a Hinglish reminder message via SMS, WhatsApp, or Email',
      parameters: {
        type: 'object',
        properties: {
          caseId: { type: 'string' },
          channel: { type: 'string', enum: ['sms', 'whatsapp', 'email'] },
          tone: { type: 'string', enum: ['soft', 'medium', 'firm'] }
        },
        required: ['caseId', 'channel', 'tone']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'retry_payment',
      description: 'Initiate Razorpay API payment gateway retry link/order creation (for payment_failed type)',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string' }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'record_promise_to_pay',
      description: 'Record a promise to pay commitment from the customer',
      parameters: {
        type: 'object',
        properties: {
          caseId: { type: 'string' },
          promisedDate: { type: 'string', description: 'ISO date string of promised date' },
          promisedAmount: { type: 'number', description: 'Amount customer promised to pay' }
        },
        required: ['caseId', 'promisedDate', 'promisedAmount']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'check_payment_status',
      description: 'Check if payment has been received via Razorpay or bank upload',
      parameters: {
        type: 'object',
        properties: {
          eventId: { type: 'string' }
        },
        required: ['eventId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'escalate_case',
      description: 'Escalate case to human account manager or manual collection team',
      parameters: {
        type: 'object',
        properties: {
          caseId: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['caseId', 'reason']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'close_case',
      description: 'Close recovery case when fully recovered or stopped by rule',
      parameters: {
        type: 'object',
        properties: {
          caseId: { type: 'string' },
          reason: { type: 'string' }
        },
        required: ['caseId', 'reason']
      }
    }
  }
];

export const executeToolCall = async (toolName, args) => {
  switch (toolName) {
    case 'get_customer': {
      const customer = await Customer.findById(args.customerId);
      return customer ? customer.toObject() : { error: 'Customer not found' };
    }

    case 'get_event': {
      const event = await RevenueEvent.findById(args.eventId);
      return event ? event.toObject() : { error: 'Event not found' };
    }

    case 'get_payment_history': {
      const customer = await Customer.findById(args.customerId);
      const pastPayments = await Payment.find({ customerId: args.customerId }).limit(10);
      return {
        paymentHistory: customer?.paymentHistory || {},
        recentPayments: pastPayments
      };
    }

    case 'get_prior_attempts': {
      const actions = await AgentAction.find({ caseId: args.caseId }).sort({ timestamp: -1 });
      return { attemptsCount: actions.length, actions };
    }

    case 'send_reminder': {
      const recCase = await RecoveryCase.findById(args.caseId);
      if (!recCase) return { error: 'Case not found' };

      const event = await RevenueEvent.findById(recCase.eventId);
      const customer = await Customer.findById(recCase.customerId);

      const messageContent = generateHinglishMessage(event, customer, args.tone);

      // Trigger REAL email delivery if channel is email
      let emailResult = null;
      if (args.channel === 'email') {
        const subject = `Revive Notice: ${event.type.replace('_', ' ').toUpperCase()} — ₹${event.amount.toLocaleString('en-IN')}`;
        emailResult = await sendEmailReminder(customer.email, subject, messageContent);
      }

      recCase.attempts += 1;
      recCase.lastActionAt = new Date();
      recCase.tone = args.tone;
      recCase.channel = args.channel;
      await recCase.save();

      const actionReason = args.channel === 'email'
        ? `Dispatched real email reminder to ${customer.email}: "${messageContent}" (Result: ${emailResult?.status || 'sent'})`
        : `Sent ${args.tone} tone reminder on ${args.channel.toUpperCase()}: "${messageContent}"`;

      const actionLog = await AgentAction.create({
        accountId: recCase.accountId || null,
        caseId: recCase._id,
        tool: 'send_reminder',
        action: `SEND_REMINDER_${args.channel.toUpperCase()}_${args.tone.toUpperCase()}`,
        reason: actionReason,
        result: 'success'
      });

      return {
        status: 'sent',
        channel: args.channel,
        tone: args.tone,
        message: messageContent,
        emailResult,
        actionId: actionLog._id
      };
    }

    case 'retry_payment': {
      const event = await RevenueEvent.findById(args.eventId);
      if (!event) return { error: 'Event not found' };

      const razorpayResult = await createRazorpayOrder(event);
      
      const recCase = await RecoveryCase.findOne({ eventId: event._id });
      if (recCase) {
        recCase.attempts += 1;
        recCase.lastActionAt = new Date();
        await recCase.save();

        await AgentAction.create({
          accountId: recCase.accountId || null,
          caseId: recCase._id,
          tool: 'retry_payment',
          action: 'RETRY_PAYMENT_INITIATED',
          reason: `Generated Razorpay payment gateway link order #${razorpayResult.orderId}`,
          result: 'success'
        });
      }

      return razorpayResult;
    }

    case 'record_promise_to_pay': {
      const recCase = await RecoveryCase.findById(args.caseId);
      if (!recCase) return { error: 'Case not found' };

      recCase.promiseToPay = {
        exists: true,
        promisedDate: new Date(args.promisedDate),
        promisedAmount: args.promisedAmount
      };
      await recCase.save();

      await AgentAction.create({
        accountId: recCase.accountId || null,
        caseId: recCase._id,
        tool: 'record_promise_to_pay',
        action: 'RECORD_PROMISE_TO_PAY',
        reason: `Customer committed promise to pay ₹${args.promisedAmount.toLocaleString('en-IN')} by ${new Date(args.promisedDate).toLocaleDateString('en-IN')}`,
        result: 'success'
      });

      return { status: 'recorded', promiseToPay: recCase.promiseToPay };
    }

    case 'check_payment_status': {
      const event = await RevenueEvent.findById(args.eventId);
      if (!event) return { error: 'Event not found' };

      const payment = await Payment.findOne({ eventId: event._id, status: 'success' });
      if (payment) {
        return { isPaid: true, payment };
      }

      const rzpStatus = await checkRazorpayPaymentStatus(event._id);
      return { isPaid: rzpStatus.paid, paymentDetails: rzpStatus };
    }

    case 'escalate_case': {
      const recCase = await RecoveryCase.findById(args.caseId);
      if (!recCase) return { error: 'Case not found' };

      recCase.status = 'escalated';
      await recCase.save();

      await RevenueEvent.findByIdAndUpdate(recCase.eventId, { status: 'escalated' });

      await AgentAction.create({
        accountId: recCase.accountId || null,
        caseId: recCase._id,
        tool: 'escalate_case',
        action: 'ESCALATE_TO_HUMAN',
        reason: args.reason || 'Case escalated to human account manager due to risk score or guardrail rule.',
        result: 'escalated'
      });

      return { status: 'escalated', caseId: recCase._id };
    }

    case 'close_case': {
      const recCase = await RecoveryCase.findById(args.caseId);
      if (!recCase) return { error: 'Case not found' };

      const newStatus = args.reason.toLowerCase().includes('recover') ? 'recovered' : 'stopped';
      recCase.status = newStatus;
      await recCase.save();

      await RevenueEvent.findByIdAndUpdate(recCase.eventId, { status: newStatus });

      await AgentAction.create({
        accountId: recCase.accountId || null,
        caseId: recCase._id,
        tool: 'close_case',
        action: `CLOSE_CASE_${newStatus.toUpperCase()}`,
        reason: args.reason,
        result: newStatus
      });

      return { status: newStatus, caseId: recCase._id };
    }

    default:
      return { error: `Unknown tool: ${toolName}` };
  }
};
