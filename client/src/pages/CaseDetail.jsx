import React, { useEffect, useState } from 'react';
import { getCaseDetail, analyzeCase, executeCaseAction, simulatePayment, escalateCase } from '../services/api';
import { StampBadge } from '../components/StampBadge';
import { CaseTimeline } from '../components/CaseTimeline';

export const CaseDetail = ({ caseId, onBack }) => {
  const [caseData, setCaseData] = useState(null);
  const [actions, setActions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [guardrailAlert, setGuardrailAlert] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState('');

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await getCaseDetail(caseId);
      if (data.success) {
        setCaseData(data.case);
        setActions(data.actions);
        setPayments(data.payments);
        if (data.case?.channel) {
          setSelectedChannel(data.case.channel);
        }
      }
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (caseId) loadCase();
  }, [caseId]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setGuardrailAlert(null);
    try {
      const res = await analyzeCase(caseId);
      if (res.success) {
        await loadCase();
      }
    } catch (err) {
      alert('Analysis failed: ' + err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setGuardrailAlert(null);
    try {
      const channelToUse = selectedChannel || caseData?.channel || 'whatsapp';
      const res = await executeCaseAction(caseId, { channel: channelToUse });
      if (res.guardrailVeto) {
        setGuardrailAlert(res.message);
      }
      await loadCase();
    } catch (err) {
      alert('Execution failed: ' + err.message);
    } finally {
      setExecuting(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (confirm('Simulate successful payment received for this event?')) {
      setPaying(true);
      try {
        await simulatePayment(caseId);
        await loadCase();
      } catch (err) {
        alert('Payment simulation failed: ' + err.message);
      } finally {
        setPaying(false);
      }
    }
  };

  const handleManualEscalate = async () => {
    const reason = prompt('Enter reason for escalating this case to human account manager:', 'Manual review requested');
    if (reason) {
      setEscalating(true);
      try {
        await escalateCase(caseId, reason);
        await loadCase();
      } catch (err) {
        alert('Escalation failed: ' + err.message);
      } finally {
        setEscalating(false);
      }
    }
  };

  const handleCopyPaymentLink = () => {
    const evObj = caseData?.eventId || {};
    const eventId = evObj._id || evObj.id || (typeof caseData?.eventId === 'string' ? caseData.eventId : caseData?.eventId?._id);
    const link = `${window.location.origin}/pay/${eventId}`;
    
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }).catch(() => {
        fallbackCopyText(link);
      });
    } else {
      fallbackCopyText(link);
    }
  };

  const fallbackCopyText = (text) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (err) {
      console.error('Failed to copy text:', err);
      alert('Payment Link: ' + text);
    }
    document.body.removeChild(textArea);
  };

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-[#5A6578]">
        <p>Opening Recovery Case Record...</p>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center font-mono text-[#D9383A]">
        Case record not found. <button onClick={onBack} className="underline font-bold">Return to Queue</button>
      </div>
    );
  }

  const ev = caseData.eventId || {};
  const customer = caseData.customerId || {};
  const reliabilityPct = Math.round((customer?.paymentHistory?.reliabilityScore || 0.7) * 100);

  return (
    <div className="space-y-8">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="font-mono text-xs text-[#5A6578] hover:text-[#0F2042] transition-colors"
      >
        <span>← BACK TO RECOVERY QUEUE</span>
      </button>

      {/* Case Header Paper Sheet */}
      <div className="ledger-card p-6 rounded-sm border-l-4 border-l-[#1A2B4C]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2D9C8] pb-4 mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono font-bold text-sm text-[#D9383A]">
                CASE #{caseData._id.toString().slice(-8).toUpperCase()}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#1A2B4C] text-white rounded-sm font-bold uppercase">
                {ev.type?.replace('_', ' ')}
              </span>
              <StampBadge status={caseData.status} />
            </div>
            <h2 className="font-serif font-extrabold text-2xl text-[#0F2042]">
              {customer.name}
            </h2>
            <div className="font-mono text-xs text-[#5A6578] flex flex-wrap items-center gap-3 mt-1">
              <span>Phone: {customer.phone}</span>
              <span>·</span>
              <span>Email: {customer.email}</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-bold text-[#5A6578] uppercase">Payment URL:</span>
              <code className="font-mono text-xs bg-[#F8F4EA] border border-[#E2D9C8] px-2 py-1 rounded-sm text-[#1A2B4C] select-all">
                {window.location.origin}/pay/{ev._id || ev.id || caseData.eventId}
              </code>
              <button
                onClick={handleCopyPaymentLink}
                className="font-mono text-xs px-3 py-1 bg-[#1A2B4C] text-white hover:bg-[#0F2042] rounded-sm font-bold transition-all flex items-center gap-1.5 shadow-sm"
                title="Copy Customer Payment Portal URL"
              >
                {copiedLink ? (
                  <>
                    <svg className="w-3.5 h-3.5 text-[#4ade80]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>COPIED!</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>COPY PAYMENT LINK</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="text-left md:text-right">
            <div className="font-serif text-xs text-[#5A6578] uppercase font-bold">AMOUNT AT RISK</div>
            <div className="font-mono text-4xl font-extrabold text-[#0F2042]">
              ₹{ev.amount?.toLocaleString('en-IN')}
            </div>
            <div className="font-mono text-xs text-[#5A6578] mt-1">
              Age: <strong className="text-[#0F2042]">{ev.ageInHours} hours</strong>
            </div>
          </div>
        </div>

        {/* Customer Reliability & Event Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Reliability Score</span>
            <span className={`font-mono text-lg font-bold ${reliabilityPct >= 80 ? 'text-[#1E7E45]' : reliabilityPct < 40 ? 'text-[#B82525]' : 'text-[#C67D0A]'}`}>
              {reliabilityPct}% ({customer.paymentHistory?.reliabilityScore >= 0.7 ? 'High' : 'Low'})
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Late History</span>
            <span className="font-mono text-lg font-bold text-[#0F2042]">
              {customer.paymentHistory?.lateCount || 0} / {customer.paymentHistory?.totalPastEvents || 0} late
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Risk Engine Score</span>
            <span className="font-mono text-lg font-bold text-[#D9383A]">
              {caseData.riskScore}/100 ({caseData.riskLevel})
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Prior Attempts</span>
            <span className="font-mono text-lg font-bold text-[#0F2042]">
              {caseData.attempts} Nudges Sent
            </span>
          </div>
        </div>
      </div>

      {/* Guardrail Override Warning Alert */}
      {guardrailAlert && (
        <div className="bg-[#FADBD8] border-2 border-[#B82525] p-4 rounded-sm text-[#B82525]">
          <h4 className="font-serif font-bold text-base uppercase">Backend Guardrail Intervened!</h4>
          <p className="font-mono text-xs mt-1 leading-relaxed">{guardrailAlert}</p>
        </div>
      )}

      {/* Agent Analysis & Recommended Action Card */}
      <div className="ledger-card p-6 rounded-sm bg-[#FAF6EC] border-2 border-[#1A2B4C]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2D9C8] pb-3 mb-4">
          <h3 className="font-serif font-extrabold text-lg text-[#0F2042]">
            AGENT DIAGNOSIS & REASONING
          </h3>
          <span className="font-mono text-xs px-2.5 py-1 bg-[#1A2B4C] text-white rounded-sm font-bold uppercase">
            Est. Recovery Prob: {Math.round((caseData.recoveryProbability || 0.5) * 100)}%
          </span>
        </div>

        {/* Agent Explanation Box */}
        <div className="bg-[#FFFDF8] p-4 rounded-sm border border-[#E2D9C8] mb-6">
          <span className="font-mono text-xs font-bold text-[#5A6578] block mb-1 uppercase">
            Plain Language Reasoning (Logged to Audit Trail):
          </span>
          <p className="font-mono text-sm text-[#0F2042] leading-relaxed">
            "{actions.find(a => a.tool === 'agent_analysis_loop')?.reason || 'Agent analyzed customer payment history, event age, and failure type. Recommending bounded nudge.'}"
          </p>
        </div>

        {/* Action Decision Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">RECOMMENDED ACTION</span>
            <span className="font-mono text-base font-extrabold text-[#1A2B4C]">
              {caseData.recommendedAction}
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">ADAPTIVE TONE</span>
            <span className="font-mono text-base font-extrabold text-[#C67D0A] uppercase">
              {caseData.tone || 'soft'} (Hinglish)
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded-sm border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase mb-0.5">TARGET CHANNEL</span>
            <select
              value={selectedChannel || caseData.channel || 'whatsapp'}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="font-mono text-sm font-extrabold text-[#1E7E45] uppercase bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm px-2 py-1 w-full focus:outline-none focus:border-[#1A2B4C]"
            >
              <option value="sms">SMS (Simulated)</option>
              <option value="whatsapp">WhatsApp (Simulated)</option>
              <option value="email">Email (Real SMTP)</option>
              <option value="telegram">Telegram (Real Instant Bot)</option>
            </select>
          </div>
        </div>

        {/* Action Controls - Outlined Buttons with Ledger Colors */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[#E2D9C8] pt-4">
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing || caseData.status !== 'open'}
            className="font-mono text-xs px-4 py-2.5 border-2 border-[#1A2B4C] bg-[#1A2B4C] text-white hover:bg-[#0F2042] disabled:opacity-50 rounded-sm font-bold transition-all"
          >
            <span>{analyzing ? 'ANALYZING...' : 'RUN AGENT ANALYSIS'}</span>
          </button>

          <button
            onClick={handleExecute}
            disabled={executing || caseData.status !== 'open'}
            className="font-mono text-xs px-4 py-2.5 border-2 border-[#D9383A] bg-[#D9383A] text-white hover:bg-[#B82525] disabled:opacity-50 rounded-sm font-bold transition-all"
          >
            <span>{executing ? 'EXECUTING...' : 'EXECUTE RECOMMENDED ACTION'}</span>
          </button>

          <button
            onClick={handleCopyPaymentLink}
            className="font-mono text-xs px-4 py-2.5 border-2 border-[#1A2B4C] bg-[#FFFDF8] text-[#1A2B4C] hover:bg-[#1A2B4C] hover:text-white rounded-sm font-bold transition-all flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <span>{copiedLink ? 'LINK COPIED TO CLIPBOARD!' : 'COPY PAYMENT LINK'}</span>
          </button>

          <button
            onClick={handleSimulatePayment}
            disabled={paying || caseData.status === 'recovered'}
            className="font-mono text-xs px-4 py-2.5 border-2 border-[#1E7E45] bg-[#1E7E45] text-white hover:bg-[#165E33] disabled:opacity-50 rounded-sm font-bold transition-all"
          >
            <span>{paying ? 'RECORDING...' : 'SIMULATE PAYMENT RECEIVED'}</span>
          </button>

          <button
            onClick={handleManualEscalate}
            disabled={escalating || caseData.status === 'escalated'}
            className="font-mono text-xs px-4 py-2.5 border border-[#BDB099] bg-[#E2D9C8] text-[#B82525] hover:bg-[#D5C9B3] rounded-sm font-bold transition-all"
          >
            <span>MANUALLY ESCALATE</span>
          </button>

        </div>
      </div>

      {/* Promise to Pay Status Card */}
      {caseData.promiseToPay?.exists && (
        <div className="ledger-card p-5 rounded-sm border-l-4 border-l-[#C67D0A] bg-[#FEF6E6]">
          <div className="flex items-center justify-between">
            <span className="text-[#C67D0A] font-mono text-xs font-bold uppercase">
              ACTIVE PROMISE-TO-PAY COMMITMENT
            </span>
            <span className="font-mono text-xs font-bold text-[#1E7E45] bg-white px-2 py-0.5 rounded-sm border border-[#E2D9C8]">
              REMINDER GUARDRAIL ACTIVE
            </span>
          </div>
          <p className="font-mono text-sm text-[#0F2042] mt-2">
            Customer committed to pay <strong>₹{caseData.promiseToPay.promisedAmount?.toLocaleString('en-IN')}</strong> by{' '}
            <strong>{new Date(caseData.promiseToPay.promisedDate).toLocaleDateString('en-IN')}</strong>. Further reminders suppressed until due date.
          </p>
        </div>
      )}

      {/* Full Audit Trail Timeline */}
      <CaseTimeline actions={actions} />

    </div>
  );
};
