import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { uploadIngestData } from '../services/api';

export const OnboardingModal = ({ isOpen, onComplete, onSkipToDemo }) => {
  const { setOnboardingDone } = useAuth();
  
  const [step, setStep] = useState(1);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  if (!isOpen) return null;

  const sampleData = `Customer Name, Amount, Disruption Type, Failure Reason
Kaveri Logistics, 185000, invoice_overdue, overdue_15_days
Priya Sharma, 4999, subscription_failed, card_expired
Aditya Patel, 12500, payment_failed, insufficient_balance
Neha Verma, 1499, cart_abandoned, null`;

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await uploadIngestData(rawText);
      if (res.success) {
        setSummary(res);
        setStep(3);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Data processing failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFinishOnboarding = async () => {
    await setOnboardingDone();
    if (onComplete) onComplete();
  };

  const handleSkipDemo = async () => {
    await setOnboardingDone();
    if (onSkipToDemo) onSkipToDemo();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2042]/40">
      <div className="ledger-paper max-w-xl w-full p-8 rounded-sm border-2 border-[#1A2B4C] relative">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between font-mono text-xs border-b border-[#E2D9C8] pb-3 mb-6">
          <span className="font-bold text-[#D9383A] uppercase tracking-wider">
            STEP {step} OF 4 — REVIVE ONBOARDING
          </span>
          <button
            onClick={handleSkipDemo}
            className="text-[#5A6578] hover:text-[#0F2042] underline font-bold"
          >
            Skip Walkthrough (Demo Mode)
          </button>
        </div>

        {/* STEP 1: WELCOME */}
        {step === 1 && (
          <div className="space-y-6 text-center">
            <div>
              <h3 className="font-serif font-extrabold text-2xl text-[#0F2042]">
                WELCOME TO REVIVE
              </h3>
              <p className="font-serif italic text-sm text-[#5A6578] mt-1">
                Your autonomous AI Revenue Recovery Agent is ready.
              </p>
            </div>

            <p className="font-mono text-xs text-[#0F2042] leading-relaxed bg-[#FFFDF8] p-4 rounded-sm border border-[#E2D9C8]">
              Let's get your revenue data in! You can paste raw CSV records or unpaid invoice notes, and our AI agent will extract customer details, compute risk scores, and run recovery actions.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => { setRawText(sampleData); setStep(2); }}
                className="flex-1 py-3 bg-[#D9383A] hover:bg-[#B82525] text-white rounded-sm font-mono text-xs font-bold uppercase tracking-wider transition-all"
              >
                <span>UPLOAD / PASTE DATA</span>
              </button>

              <button
                onClick={handleSkipDemo}
                className="flex-1 py-3 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] rounded-sm font-mono text-xs font-bold transition-all"
              >
                <span>LOAD PRE-SEEDED DEMO</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: UPLOAD */}
        {step === 2 && (
          <form onSubmit={handleUploadSubmit} className="space-y-4 font-mono text-xs">
            <div>
              <h3 className="font-serif font-bold text-xl text-[#0F2042]">
                PASTE YOUR REVENUE DISRUPTION DATA
              </h3>
              <p className="font-mono text-xs text-[#5A6578] mt-0.5">
                Paste CSV content or raw ledger notes below.
              </p>
            </div>

            {error && (
              <div className="bg-[#FADBD8] border border-[#B82525] text-[#B82525] p-3 rounded-sm">
                {error}
              </div>
            )}

            <textarea
              rows={6}
              required
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C] leading-relaxed"
            />

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 bg-[#E2D9C8] text-[#0F2042] rounded-sm font-bold"
              >
                BACK
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-[#D9383A] hover:bg-[#B82525] disabled:opacity-50 text-white rounded-sm font-bold uppercase tracking-wider"
              >
                <span>{loading ? 'LLM INGESTING...' : 'PROCESS DATA'}</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: RESULT */}
        {step === 3 && summary && (
          <div className="space-y-6 text-center font-mono">
            <div>
              <h3 className="font-serif font-extrabold text-2xl text-[#1E7E45]">
                DATA EXTRACTION COMPLETE!
              </h3>
              <p className="font-mono text-xs text-[#5A6578] mt-1">
                Revive AI has extracted and structured your records into the recovery pipeline.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-[#FFFDF8] p-3 rounded-sm border border-[#E2D9C8]">
                <span className="text-[#5A6578] text-[10px] block">RECORDS EXTRACTED</span>
                <span className="font-bold text-xl text-[#0F2042]">{summary.recordsFound}</span>
              </div>
              <div className="bg-[#FFFDF8] p-3 rounded-sm border border-[#E2D9C8]">
                <span className="text-[#5A6578] text-[10px] block">NEW CUSTOMERS</span>
                <span className="font-bold text-xl text-[#1E7E45]">{summary.customersCreated}</span>
              </div>
              <div className="bg-[#FFFDF8] p-3 rounded-sm border border-[#E2D9C8]">
                <span className="text-[#5A6578] text-[10px] block">AT-RISK TOTAL</span>
                <span className="font-bold text-xl text-[#D9383A]">₹{summary.totalAtRisk?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => setStep(4)}
              className="w-full py-3 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded-sm font-bold uppercase tracking-wider"
            >
              <span>PROCEED TO PANEL WALKTHROUGH →</span>
            </button>
          </div>
        )}

        {/* STEP 4: WALKTHROUGH */}
        {step === 4 && (
          <div className="space-y-6 font-mono text-xs">
            <div>
              <h3 className="font-serif font-extrabold text-2xl text-[#0F2042]">
                QUICK PANEL WALKTHROUGH
              </h3>
              <p className="font-serif italic text-xs text-[#5A6578] mt-0.5">
                Here's how to use your Revive Revenue Recovery Panel:
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-[#FFFDF8] border-l-4 border-l-[#1A2B4C] rounded-sm">
                <strong className="text-[#0F2042] block font-bold">1. DASHBOARD & FUNNEL</strong>
                <span>Monitors overall recovered amount, recovery rate %, 4-stage funnel register, and pitch proof metrics.</span>
              </div>

              <div className="p-3 bg-[#FFFDF8] border-l-4 border-l-[#1E7E45] rounded-sm">
                <strong className="text-[#0F2042] block font-bold">2. RECOVERY QUEUE</strong>
                <span>Filterable register table listing every case across payment, cart, subscription, and invoice failures.</span>
              </div>

              <div className="p-3 bg-[#FFFDF8] border-l-4 border-l-[#D9383A] rounded-sm">
                <strong className="text-[#0F2042] block font-bold">3. CASE DIAGNOSIS & AUDIT TRAIL</strong>
                <span>Click any case to view plain-language reasoning, adaptive Hinglish tone, guardrails status, and execute real actions.</span>
              </div>
            </div>

            <button
              onClick={handleFinishOnboarding}
              className="w-full py-3 bg-[#D9383A] hover:bg-[#B82525] text-white rounded-sm font-bold uppercase tracking-wider"
            >
              <span>ENTER REVIVE RECOVERY PANEL →</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
