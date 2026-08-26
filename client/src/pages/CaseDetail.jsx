import React, { useEffect, useState } from 'react';
import { getCaseDetail, analyzeCase, executeCaseAction, simulatePayment, escalateCase } from '../services/api';
import { StampBadge } from '../components/StampBadge';
import { CaseTimeline } from '../components/CaseTimeline';
import { ArrowLeft, Play, Zap, CheckCircle2, ShieldAlert, AlertTriangle, Send, DollarSign, Clock, User, FileText, Sparkles } from 'lucide-react';

export const CaseDetail = ({ caseId, onBack }) => {
  const [caseData, setCaseData] = useState(null);
  const [actions, setActions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [guardrailAlert, setGuardrailAlert] = useState(null);

  const loadCase = async () => {
    setLoading(true);
    try {
      const data = await getCaseDetail(caseId);
      if (data.success) {
        setCaseData(data.case);
        setActions(data.actions);
        setPayments(data.payments);
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
      const res = await executeCaseAction(caseId);
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

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-[#5A6578]">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D9383A] border-t-transparent rounded-full mb-4"></div>
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
        className="flex items-center space-x-2 font-mono text-xs text-[#5A6578] hover:text-[#0F2042] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>BACK TO RECOVERY QUEUE</span>
      </button>

      {/* Case Header Paper Sheet */}
      <div className="ledger-card p-6 rounded-lg relative border-l-8 border-l-[#1A2B4C]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2D9C8] pb-4 mb-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="font-mono font-bold text-sm text-[#D9383A]">
                CASE #{caseData._id.toString().slice(-8).toUpperCase()}
              </span>
              <span className="font-mono text-xs px-2 py-0.5 bg-[#1A2B4C] text-white rounded font-bold uppercase">
                {ev.type?.replace('_', ' ')}
              </span>
              <StampBadge status={caseData.status} />
            </div>
            <h2 className="font-serif font-extrabold text-2xl text-[#0F2042]">
              {customer.name}
            </h2>
            <div className="font-mono text-xs text-[#5A6578] flex items-center space-x-3 mt-1">
              <span>Phone: {customer.phone}</span>
              <span>•</span>
              <span>Email: {customer.email}</span>
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
          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Reliability Score</span>
            <span className={`font-mono text-lg font-bold ${reliabilityPct >= 80 ? 'text-[#1E7E45]' : reliabilityPct < 40 ? 'text-[#B82525]' : 'text-[#C67D0A]'}`}>
              {reliabilityPct}% ({customer.paymentHistory?.reliabilityScore >= 0.7 ? 'High' : 'Low'})
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Late History</span>
            <span className="font-mono text-lg font-bold text-[#0F2042]">
              {customer.paymentHistory?.lateCount || 0} / {customer.paymentHistory?.totalPastEvents || 0} late
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Risk Engine Score</span>
            <span className="font-mono text-lg font-bold text-[#D9383A]">
              {caseData.riskScore}/100 ({caseData.riskLevel})
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">Prior Attempts</span>
            <span className="font-mono text-lg font-bold text-[#0F2042]">
              {caseData.attempts} Nudges Sent
            </span>
          </div>
        </div>
      </div>

      {/* Guardrail Override Warning Alert */}
      {guardrailAlert && (
        <div className="bg-[#FADBD8] border-2 border-[#B82525] p-4 rounded-lg flex items-start space-x-3 text-[#B82525]">
          <ShieldAlert className="w-6 h-6 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-serif font-bold text-base">Backend Guardrail Intervened!</h4>
            <p className="font-mono text-xs mt-1 leading-relaxed">{guardrailAlert}</p>
          </div>
        </div>
      )}

      {/* Agent Analysis & Recommended Action Card */}
      <div className="ledger-card p-6 rounded-lg bg-[#FAF6EC] border-2 border-[#1A2B4C] shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E2D9C8] pb-3 mb-4">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-[#D9383A]" />
            <h3 className="font-serif font-extrabold text-lg text-[#0F2042]">
              AGENT DIAGNOSIS & REASONING
            </h3>
          </div>
          <span className="font-mono text-xs px-2.5 py-1 bg-[#1A2B4C] text-white rounded font-bold uppercase">
            Est. Recovery Prob: {Math.round((caseData.recoveryProbability || 0.5) * 100)}%
          </span>
        </div>

        {/* Agent Explanation Box */}
        <div className="bg-[#FFFDF8] p-4 rounded border border-[#E2D9C8] mb-6">
          <span className="font-mono text-xs font-bold text-[#5A6578] block mb-1 uppercase">
            Plain Language Reasoning (Logged to Audit Trail):
          </span>
          <p className="font-mono text-sm text-[#0F2042] leading-relaxed">
            "{actions.find(a => a.tool === 'agent_analysis_loop')?.reason || 'Agent analyzed customer payment history, event age, and failure type. Recommending bounded nudge.'}"
          </p>
        </div>

        {/* Action Decision Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">RECOMMENDED ACTION</span>
            <span className="font-mono text-base font-extrabold text-[#1A2B4C]">
              {caseData.recommendedAction}
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">ADAPTIVE TONE</span>
            <span className="font-mono text-base font-extrabold text-[#C67D0A] uppercase">
              {caseData.tone || 'soft'} (Hinglish)
            </span>
          </div>

          <div className="bg-[#F8F4EA] p-3 rounded border border-[#E2D9C8]">
            <span className="font-mono text-[10px] text-[#5A6578] block font-bold uppercase">CHANNEL</span>
            <span className="font-mono text-base font-extrabold text-[#1E7E45] uppercase">
              {caseData.channel || 'whatsapp'}
            </span>
          </div>
        </div>

        {/* Interactive Action Controls */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[#E2D9C8] pt-4">
          
          <button
            onClick={handleAnalyze}
            disabled={analyzing || caseData.status !== 'open'}
            className="flex items-center space-x-2 font-mono text-xs px-4 py-2.5 bg-[#1A2B4C] hover:bg-[#0F2042] disabled:opacity-50 text-white rounded font-bold transition-all shadow-xs"
          >
            <Sparkles className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
            <span>{analyzing ? 'ANALYZING...' : 'RUN AGENT ANALYSIS'}</span>
          </button>

          <button
            onClick={handleExecute}
            disabled={executing || caseData.status !== 'open'}
            className="flex items-center space-x-2 font-mono text-xs px-4 py-2.5 bg-[#D9383A] hover:bg-[#B82525] disabled:opacity-50 text-white rounded font-bold transition-all shadow-xs"
          >
            <Send className="w-4 h-4" />
            <span>{executing ? 'EXECUTING...' : 'EXECUTE RECOMMENDED ACTION'}</span>
          </button>

          <button
            onClick={handleSimulatePayment}
            disabled={paying || caseData.status === 'recovered'}
            className="flex items-center space-x-2 font-mono text-xs px-4 py-2.5 bg-[#1E7E45] hover:bg-[#165E33] disabled:opacity-50 text-white rounded font-bold transition-all shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{paying ? 'RECORDING...' : 'SIMULATE PAYMENT RECEIVED'}</span>
          </button>

          <button
            onClick={handleManualEscalate}
            disabled={escalating || caseData.status === 'escalated'}
            className="flex items-center space-x-2 font-mono text-xs px-4 py-2.5 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded font-bold transition-all shadow-xs"
          >
            <ShieldAlert className="w-4 h-4 text-[#B82525]" />
            <span>MANUALLY ESCALATE</span>
          </button>

        </div>
      </div>

      {/* Promise to Pay Status Card */}
      {caseData.promiseToPay?.exists && (
        <div className="ledger-card p-5 rounded-lg border-l-4 border-l-[#C67D0A] bg-[#FEF6E6]">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[#C67D0A] font-mono text-xs font-bold uppercase">
              <Clock className="w-4 h-4" />
              <span>ACTIVE PROMISE-TO-PAY COMMITMENT</span>
            </div>
            <span className="font-mono text-xs font-bold text-[#1E7E45] bg-white px-2 py-0.5 rounded border border-[#E2D9C8]">
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
