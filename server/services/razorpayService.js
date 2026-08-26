import Razorpay from 'razorpay';

let razorpayInstance = null;

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (key_id && key_secret) {
  try {
    razorpayInstance = new Razorpay({ key_id, key_secret });
    console.log('[RAZORPAY] Initialized with test mode API key.');
  } catch (err) {
    console.warn('[RAZORPAY] Failed to initialize Razorpay SDK:', err.message);
  }
}

export const createRazorpayOrder = async (event) => {
  if (razorpayInstance && event.type === 'payment_failed') {
    try {
      const options = {
        amount: Math.round(event.amount * 100), // amount in paise
        currency: 'INR',
        receipt: `rcpt_${event._id.toString().slice(-8)}`,
        notes: {
          wapas_event_id: event._id.toString(),
          type: event.type
        }
      };

      const order = await razorpayInstance.orders.create(options);
      return {
        mode: 'live_test_api',
        orderId: order.id,
        amount: order.amount / 100,
        currency: order.currency,
        paymentUrl: `https://pay.razorpay.com/wapas/${order.id}`
      };
    } catch (err) {
      console.warn('[RAZORPAY] Order creation failed, falling back to sandbox mode:', err.message);
    }
  }

  // Fallback sandbox response if no live Razorpay API key or for sandbox mode
  const mockOrderId = `order_test_${event._id.toString().slice(-8)}`;
  return {
    mode: 'sandbox_simulation',
    orderId: mockOrderId,
    amount: event.amount,
    currency: 'INR',
    paymentUrl: `https://pay.razorpay.com/wapas/${mockOrderId}`
  };
};

export const checkRazorpayPaymentStatus = async (eventId) => {
  // In sandbox, check simulated status
  return {
    eventId,
    paid: false,
    status: 'pending',
    message: 'Sandbox check completed'
  };
};
