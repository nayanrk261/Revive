import React, { useEffect, useState } from 'react';
import { getPublicEventDetail, completePublicPayment, retryPublicPayment } from '../services/api';

export const PublicPaymentPage = ({ eventId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);
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

  const handlePayNow = async () => {
    setProcessing(true);
    setGuardrailAlert(null);
    try {
      const res = await completePublicPayment(eventId, 'upi_razorpay');
      if (res.success) {
        setPaymentSuccess({
          message: res.message || 'Payment completed successfully!',
          transactionId: res.transactionId || 'pay_' + Math.random().toString(36).substring(2, 8).toUpperCase()
        });
        setEventData(prev => ({ ...prev, status: 'recovered' }));
      } else {
        alert(res.error || 'Payment processing failed');
      }
    } catch (err) {
      alert(err.response?.data?.error || err.message || 'Payment processing failed');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryGateway = async () => {
    setProcessing(true);
    setGuardrailAlert(null);
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
        alert(res.error || 'Retry failed');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message;
      if (err.response?.data?.guardrailVeto) {
        setGuardrailAlert(msg);
      } else {
        alert('Retry request error: ' + msg);
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
        <div className="max-w-3xl mx-auto flex items-center justify-between">
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
            Please review your pending transaction details below to complete your payment securely.
          </p>
        </div>

        {/* Guardrail Veto Alert */}
        {guardrailAlert && (
          <div className="p-4 bg-[#FADBD8] border-2 border-[#D9383A] text-[#B82525] rounded-sm font-mono text-xs">
            <strong className="block font-bold mb-1">AUTOMATED GUARDRAIL NOTICE:</strong>
            {guardrailAlert}
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
          
          <div className="flex items-center justify-between border-b border-[#E2D9C8] pb-4">
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
          <div className="bg-[#FFFDF8] p-5 rounded-sm border border-[#E2D9C8] flex items-center justify-between">
            <div>
              <span className="font-mono text-xs text-[#5A6578] block font-bold uppercase">
                TOTAL AMOUNT DUE
              </span>
              <span className="font-mono text-xs text-[#5A6578]">
                Includes all applicable taxes & fees
              </span>
            </div>

            <div className="font-mono text-3xl font-extrabold text-[#D9383A]">
              ₹{eventData.amount.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Payment Action Buttons */}
          {!isPaid ? (
            <div className="space-y-3 pt-2">
              <button
                onClick={handlePayNow}
                disabled={processing}
                className="w-full py-4 bg-[#1E7E45] hover:bg-[#165E33] disabled:opacity-50 text-white font-mono text-sm font-bold uppercase tracking-wider rounded-sm transition-all shadow-sm"
              >
                <span>{processing ? 'PROCESSING PAYMENT...' : `PAY ₹${eventData.amount.toLocaleString('en-IN')} NOW (INSTANT UPI / CARD)`}</span>
              </button>

              <button
                onClick={handleRetryGateway}
                disabled={processing}
                className="w-full py-3 bg-[#1A2B4C] hover:bg-[#0F2042] disabled:opacity-50 text-white font-mono text-xs font-bold uppercase tracking-wider rounded-sm transition-all"
              >
                <span>{processing ? 'RETRYING...' : 'RETRY PAYMENT GATEWAY ATTEMPT'}</span>
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
