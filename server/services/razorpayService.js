import Razorpay from 'razorpay';
import { RevenueEvent } from '../models/RevenueEvent.js';

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (key_id && key_secret && key_id !== 'your_razorpay_test_key_id') {
    try {
      return new Razorpay({ key_id, key_secret });
    } catch (err) {
      console.warn('[RAZORPAY] Failed to initialize Razorpay SDK:', err.message);
    }
  }
  return null;
};

export const createRazorpayOrder = async (event) => {
  const instance = getRazorpayInstance();

  // If order already exists on event and instance is available, fetch and return
  if (event.razorpayOrderId && instance) {
    try {
      const existingOrder = await instance.orders.fetch(event.razorpayOrderId);
      if (existingOrder && existingOrder.status === 'created') {
        return {
          mode: 'live_test_api',
          orderId: existingOrder.id,
          amount: existingOrder.amount / 100,
          currency: existingOrder.currency
        };
      }
    } catch (fetchErr) {
      console.warn('[RAZORPAY] Could not fetch existing order:', fetchErr.message);
    }
  }

  if (instance) {
    try {
      const options = {
        amount: Math.round(event.amount * 100), // amount in paise
        currency: 'INR',
        receipt: `rcpt_${event._id.toString().slice(-8)}`,
        notes: {
          revive_event_id: event._id.toString(),
          type: event.type
        }
      };

      const order = await instance.orders.create(options);
      
      // Store Razorpay orderId on RevenueEvent
      event.razorpayOrderId = order.id;
      await event.save();

      return {
        mode: 'live_test_api',
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency
      };
    } catch (err) {
      console.warn('[RAZORPAY] Order creation failed:', err.message);
    }
  }

  // Fallback sandbox order ID when API keys are unconfigured
  const mockOrderId = event.razorpayOrderId || `order_test_${event._id.toString().slice(-8)}`;
  event.razorpayOrderId = mockOrderId;
  await event.save();

  return {
    mode: 'sandbox_simulation',
    orderId: mockOrderId,
    amount: event.amount,
    currency: 'INR'
  };
};

export const checkRazorpayPaymentStatus = async (eventId) => {
  const event = await RevenueEvent.findById(eventId);
  const instance = getRazorpayInstance();

  if (!instance || !event || !event.razorpayOrderId) {
    return { eventId, paid: false, status: 'unknown', message: 'Razorpay not configured or order missing' };
  }

  try {
    const payments = await instance.orders.fetchPayments(event.razorpayOrderId);
    const captured = Boolean(payments.items && payments.items.some(p => p.status === 'captured'));

    return {
      eventId,
      paid: captured,
      status: captured ? 'captured' : (payments.items && payments.items.length > 0 ? payments.items[0].status : 'pending')
    };
  } catch (err) {
    console.warn('[RAZORPAY] Check payment status error:', err.message);
    return { eventId, paid: false, status: 'error', message: err.message };
  }
};
