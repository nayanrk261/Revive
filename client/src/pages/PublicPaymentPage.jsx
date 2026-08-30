import React, { useEffect, useState } from 'react';
import {
  getPublicEventDetail,
  completePublicPayment,
  retryPublicPayment,
  createPublicRazorpayOrder,
  verifyPublicRazorpayPayment
} from '../services/api';

export const PublicPaymentPage = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
  const [paymentError, setPaymentError] = useState(null);
  const [guardrailAlert, setGuardrailAlert] = useState(null);

  const loadPublicEvent = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPublicEventDetail(eventId);
      if (data.success) {
        setEventData(data.event);
        if (data.event.status === 'recovered') {
          setPaymentSuccess({
            message: 'Payment has already been completed for this transaction.',
            transactionId: 'VERIFIED_PAID'
          });
        }
      } else {
        setError(data.error || 'Payment record not found');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to load transaction details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      loadPublicEvent();
    }
  }, [eventId]);

  const handleRealPayment = async () => {
    setProcessing(true);
    setGuardrailAlert(null);
    setPaymentError(null);
    try {
      const orderData = await createPublicRazorpayOrder(eventId);
      if (!orderData.success) {
        setPaymentError(orderData.error || 'Failed to initialize Razorpay payment order');
        setProcessing(false);
        return;
      }

      if (typeof window.Razorpay === 'undefined') {
        setPaymentError('Razorpay Checkout SDK is loading... Please try again in a moment.');
        setProcessing(false);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        order_id: orderData.orderId,
        name: 'Revive Revenue Recovery',
        description: `Payment for ${getTypeTitle(eventData.type)}`,
        handler: async function (response) {
          setProcessing(true);
          try {
            const verifyRes = await verifyPublicRazorpayPayment(eventId, response);
            if (verifyRes.success) {
              setPaymentSuccess({
                message: 'Real Razorpay payment captured and signature-verified!',
                transactionId: verifyRes.transactionId || response.razorpay_payment_id
              });
              setEventData(prev => ({ ...prev, status: 'recovered' }));
              setPaymentError(null);
            } else {
              setPaymentError(verifyRes.error || 'Payment verification failed');
            }
          } catch (vErr) {
            setPaymentError('Payment verification error: ' + (vErr.response?.data?.error || vErr.message));
          } finally {
            setProcessing(false);
          }
        },
        modal: {
          ondismiss: function () {
            setProcessing(false);
            setPaymentError('Payment popup was closed before completion. You can try again using the button below.');
          }
        },
        theme: { color: '#D9383A' } // Revive ledger-red accent
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setProcessing(false);
        const failureReason = response.error?.description || response.error?.reason || 'Payment transaction failed or was declined by bank.';
        setPaymentError(`Payment Failed: ${failureReason}`);
      });
      rzp.open();
    } catch (err) {
      setPaymentError('Order creation error: ' + (err.response?.data?.error || err.message));
      setProcessing(false);
    }
  };

  const handleRetryGateway = async () => {
    setProcessing(true);
    setGuardrailAlert(null);
    setPaymentError(null);
    try {
      const res = await retryPublicPayment(eventId);
      if (res.guardrailVeto) {
        setGuardrailAlert(res.message);
      } else if (res.alreadyPaid) {
        setPaymentSuccess({
          message: 'Payment already completed.',
          transactionId: 'VERIFIED_PAID'
        });
      } else if (res.success) {
        alert('Gateway payment retry initiated! Check your UPI app or payment notification.');
      } else {
        setPaymentError(res.error || 'Retry attempt failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (err.response?.data?.guardrailVeto) {
        setGuardrailAlert(msg);
      } else {
        setPaymentError('Retry request error: ' + msg);
      }
    } finally {
      setProcessing(false);
    }
  };

  const getTypeTitle = (type) => {
    switch (type) {
      case 'payment_failed': return 'Payment Completion Required';
      case 'cart_abandoned': return 'Saved Cart Checkout Reservation';
      case 'subscription_failed': return 'Subscription Plan Renewal';
      case 'invoice_overdue': return 'B2B Invoice Payment';
      default: return 'Pending Revenue Transaction';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8EF] flex items-center justify-center p-6 font-mono text-[#5A6578]">
        <div className="text-center space-y-3">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D9383A] border-t-transparent rounded-full"></div>
          <p className="font-bold">Verifying Revive Payment Authorization...</p>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-[#FBF8EF] flex items-center justify-center p-6">
        <div className="ledger-card max-w-md w-full p-8 rounded-sm border-2 border-[#D9383A] text-center space-y-4">
          <div className="font-mono text-xs font-bold text-[#D9383A] uppercase tracking-wider">
            TRANSACTION NOT FOUND / EXPIRED
          </div>
          <h2 className="font-serif font-extrabold text-xl text-[#0F2042]">
            Invalid Payment Link
          </h2>
          <p className="font-mono text-xs text-[#5A6578]">
            {error || 'The requested payment link does not exist or has expired.'}
          </p>
          <a
            href="/"
            className="inline-block mt-4 px-5 py-2.5 bg-[#1A2B4C] text-white font-mono text-xs font-bold rounded-sm"
          >
            RETURN TO REVIVE HOMEPAGE
          </a>
        </div>
      </div>
    );
  }

  const isPaid = eventData.status === 'recovered' || paymentSuccess !== null;

  return (
    <div className="min-h-screen bg-[#FBF8EF] text-[#0F2042] flex flex-col font-serif">
      
      {/* Portal Header */}
      <header className="border-b-2 border-[#1A2B4C] bg-[#FAF6EC] py-4 px-6 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center space-x-3">
            <span className="font-serif font-extrabold text-xl text-[#0F2042] tracking-wider">
              REVIVE
            </span>
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#1A2B4C] text-white rounded-sm font-bold uppercase">
              SECURE PAYMENT PORTAL
            </span>
          </div>
          <span className="font-mono text-xs text-[#1E7E45] font-bold">
            256-BIT ENCRYPTED
          </span>
        </div>
      </header>

      {/* Main Payment Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
        
        {/* Customer Greeting */}
        <div className="border-b border-[#E2D9C8] pb-4">
          <h1 className="font-serif font-extrabold text-3xl text-[#0F2042]">
            Hello, {eventData.customerFirstName} 👋
          </h1>
          <p className="font-mono text-xs text-[#5A6578] mt-1">
            Please review your pending transaction details below to complete your payment securely via Razorpay.
          </p>
        </div>

        {/* Guardrail Veto Alert */}
        {guardrailAlert && (
          <div className="p-4 bg-[#FADBD8] border-2 border-[#D9383A] text-[#B82525] rounded-sm font-mono text-xs">
            <strong className="block font-bold mb-1">AUTOMATED GUARDRAIL NOTICE:</strong>
            {guardrailAlert}
          </div>
        )}

        {/* Payment Error / Failure Alert */}
        {paymentError && (
          <div className="p-5 bg-[#FADBD8] border-2 border-[#D9383A] text-[#B82525] rounded-sm font-mono text-xs space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold uppercase tracking-wider text-[#D9383A]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>PAYMENT UNSUCCESSFUL</span>
              </div>
              <button 
                onClick={() => setPaymentError(null)} 
                className="font-bold text-[#D9383A] hover:underline text-[10px] uppercase"
              >
                DISMISS
              </button>
            </div>
            <p className="leading-relaxed text-[#0F2042]">
              {paymentError}
            </p>
            <div className="pt-1 flex items-center gap-3">
              <button
                onClick={() => {
                  setPaymentError(null);
                  handleRealPayment();
                }}
                className="px-4 py-2 bg-[#D9383A] text-white font-bold rounded-sm hover:bg-[#B82525] transition-all text-xs flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>TRY AGAIN NOW (RAZORPAY)</span>
              </button>
            </div>
          </div>
        )}

        {/* Payment Confirmation Banner */}
        {isPaid && (
          <div className="p-6 bg-[#E8F8F0] border-2 border-[#1E7E45] rounded-sm text-center space-y-2">
            <span className="font-mono text-xs font-bold text-[#1E7E45] px-3 py-1 bg-white border border-[#1E7E45] rounded-sm uppercase tracking-wider">
              STAMP: VERIFIED RECOVERED
            </span>
            <h2 className="font-serif font-extrabold text-2xl text-[#1E7E45] pt-2">
              Payment Confirmed & Verified!
            </h2>
            <p className="font-mono text-xs text-[#0F2042]">
              {paymentSuccess?.message || 'Your payment has been successfully recorded in the Revive ledger.'}
            </p>
            {paymentSuccess?.transactionId && (
              <div className="font-mono text-xs text-[#5A6578] pt-2">
                Transaction Ref: <strong className="text-[#0F2042]">{paymentSuccess.transactionId}</strong>
              </div>
            )}
          </div>
        )}

        {/* Transaction Ledger Card */}
        <div className="ledger-card p-6 rounded-sm bg-[#FAF6EC] border-2 border-[#1A2B4C] space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E2D9C8] pb-4">
            <div>
              <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">
                TRANSACTION TYPE
              </span>
              <span className="font-serif font-bold text-lg text-[#0F2042]">
                {getTypeTitle(eventData.type)}
              </span>
            </div>

            <div className="text-right">
              <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">
                REFERENCE REF
              </span>
              <span className="font-mono text-xs font-bold text-[#1A2B4C]">
                #PAY-{eventData.id.slice(-8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Amount Due Display */}
          <div className="bg-[#FFFDF8] p-5 rounded-sm border border-[#E2D9C8] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="font-mono text-xs text-[#5A6578] block font-bold uppercase">
                TOTAL AMOUNT DUE
              </span>
              <span className="font-mono text-xs text-[#5A6578]">
                Includes all applicable taxes & fees
              </span>
            </div>

            <div className="font-mono text-2xl sm:text-3xl font-extrabold text-[#D9383A]">
              ₹{eventData.amount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Payment Action Buttons */}
          {!isPaid ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={() => {
                  setPaymentError(null);
                  handleRealPayment();
                }}
                disabled={processing}
                className="w-full py-4 bg-[#D9383A] hover:bg-[#B82525] disabled:opacity-50 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>OPENING RAZORPAY CHECKOUT...</span>
                  </>
                ) : (
                  <span>{paymentError ? `TRY AGAIN — PAY ₹${eventData.amount.toLocaleString('en-IN')} (RAZORPAY)` : `PAY ₹${eventData.amount.toLocaleString('en-IN')} NOW (RAZORPAY CHECKOUT)`}</span>
                )}
              </button>

              <button
                onClick={() => {
                  setPaymentError(null);
                  handleRetryGateway();
                }}
                disabled={processing}
                className="w-full py-3 bg-[#1A2B4C] hover:bg-[#0F2042] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-all flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>PROCESSING ATTEMPT...</span>
                  </>
                ) : (
                  <span>RETRY AUTO-PAYMENT ATTEMPT</span>
                )}
              </button>
            </div>
          ) : (
            <div className="text-center font-mono text-xs text-[#1E7E45] font-bold py-2 border-t border-[#E2D9C8]">
              ✓ No further action is required for this transaction.
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-[#E2D9C8] py-4 text-center font-mono text-[11px] text-[#5A6578]">
        Powered by Revive AI Revenue Recovery System • Razorpay Integrated
      </footer>

    </div>
  );
};
