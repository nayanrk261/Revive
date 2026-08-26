import React, { useEffect, useState } from 'react';
import { compareBaseline, runBatchProcess } from '../services/api';
import { Zap, Play, CheckCircle2, AlertOctagon, TrendingUp, ShieldAlert, ArrowRight, RefreshCw } from 'lucide-react';

export const BatchComparison = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [batchResults, setBatchResults] = useState(null);

  const runComparison = async () => {
    setLoading(true);
    try {
      const res = await compareBaseline();
      if (res.success) {
        setData(res.comparison);
      }
    } catch (err) {
      console.error('Failed to run comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAgentBatch = async () => {
    setBatchProcessing(true);
    try {
      const res = await runBatchProcess();
      if (res.success) {
        setBatchResults(res);
        await runComparison();
      }
    } catch (err) {
      alert('Batch execution failed: ' + err.message);
    } finally {
      setBatchProcessing(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, []);

  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8">
      
      {/* Header Banner */}
      <div className="ledger-card p-6 rounded-lg bg-[#FAF6EC] border-2 border-[#1A2B4C] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-[#D9383A] font-mono text-xs font-bold uppercase mb-1">
            <Zap className="w-4 h-4" />
            <span>PITCH BENCHMARK PROOF</span>
          </div>
          <h2 className="font-serif font-extrabold text-2xl text-[#0F2042]">
            RULES-ONLY BASELINE VS WAPAS AI AGENT
          </h2>
          <p className="font-mono text-xs text-[#5A6578]">
            Proves Wapas agent adds true recovery lift compared to standard static rules engines.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={runComparison}
            disabled={loading}
            className="flex items-center space-x-2 font-mono text-xs px-4 py-2.5 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded font-bold transition-all shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>RE-RUN COMPARISON</span>
          </button>

          <button
            onClick={handleRunAgentBatch}
            disabled={batchProcessing}
            className="flex items-center space-x-2 font-mono text-xs px-5 py-2.5 bg-[#1A2B4C] hover:bg-[#0F2042] disabled:opacity-50 text-white rounded font-bold transition-all shadow-md"
          >
            <Play className={`w-4 h-4 text-[#D9383A] ${batchProcessing ? 'animate-spin' : ''}`} />
            <span>{batchProcessing ? 'RUNNING BATCH...' : 'RUN AGENT ACROSS ALL OPEN CASES'}</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center font-mono text-[#5A6578]">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D9383A] border-t-transparent rounded-full mb-4"></div>
          <p>Evaluating 150 synthetic cases across both engines...</p>
        </div>
      ) : data ? (
        <>
          {/* Key Proof Hero Comparison Banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Rules-only Card */}
            <div className="ledger-card p-6 rounded-lg border-2 border-gray-400 bg-[#F4F0E6] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs font-bold text-gray-600 uppercase">1. RULES-ONLY BASELINE</span>
                  <AlertOctagon className="w-5 h-5 text-gray-500" />
                </div>
                <div className="font-serif italic text-xs text-gray-600 mb-4">
                  Rule: If risk &gt; 70 → escalate; else 1 generic reminder, no follow-up.
                </div>
                <div className="font-mono text-4xl font-extrabold text-gray-700">
                  {data.rulesOnly?.recoveryRatePct}%
                </div>
                <div className="font-mono text-xs text-gray-600 mt-1">Recovery Conversion Rate</div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-300 font-mono text-xs text-gray-700 space-y-1">
                <div>Recovered Cases: <strong>{data.rulesOnly?.recoveredCount} / {data.casesProcessed}</strong></div>
                <div>Recovered Amount: <strong>{formatINR(data.rulesOnly?.recoveredAmount)}</strong></div>
                <div>Escalated Cases: <strong>{data.rulesOnly?.escalatedCount}</strong></div>
              </div>
            </div>

            {/* Wapas AI Agent Card */}
            <div className="ledger-card p-6 rounded-lg border-2 border-[#1E7E45] bg-[#EBF7F0] shadow-md flex flex-col justify-between relative overflow-hidden">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs font-bold text-[#1E7E45] uppercase">2. WAPAS AI AGENT</span>
                  <Zap className="w-5 h-5 text-[#1E7E45]" />
                </div>
                <div className="font-serif italic text-xs text-[#1E7E45] mb-4">
                  Agent: Multi-step tool loop, Hinglish tone adaptation, promise tracking.
                </div>
                <div className="font-mono text-5xl font-extrabold text-[#1E7E45]">
                  {data.wapasAgent?.recoveryRatePct}%
                </div>
                <div className="font-mono text-xs text-[#1E7E45] font-bold mt-1">Recovery Conversion Rate</div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#C7E9D4] font-mono text-xs text-[#0F2042] space-y-1">
                <div>Recovered Cases: <strong>{data.wapasAgent?.recoveredCount} / {data.casesProcessed}</strong></div>
                <div>Recovered Amount: <strong>{formatINR(data.wapasAgent?.recoveredAmount)}</strong></div>
                <div>Escalated Cases: <strong>{data.wapasAgent?.escalatedCount}</strong></div>
              </div>

              <div className="absolute right-2 bottom-2 opacity-10 pointer-events-none transform -rotate-12">
                <span className="rubber-stamp stamp-recovered text-4xl">WINNER</span>
              </div>
            </div>

            {/* Lift & Additional Revenue Card */}
            <div className="ledger-card p-6 rounded-lg border-2 border-[#D9383A] bg-[#FFFDF8] flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="font-mono text-xs font-bold text-[#D9383A] uppercase">RECOVERY LIFT & LIFT VALUE</span>
                  <TrendingUp className="w-5 h-5 text-[#D9383A]" />
                </div>
                <div className="font-mono text-4xl font-extrabold text-[#D9383A]">
                  +{data.liftPct}%
                </div>
                <div className="font-mono text-xs text-[#5A6578] mt-1 font-bold">Absolute Recovery Rate Increase</div>
                
                <div className="mt-4 p-3 bg-[#FADBD8] rounded border border-[#F5B7B1]">
                  <span className="font-mono text-[11px] text-[#B82525] uppercase font-bold block">Additional Revenue Saved:</span>
                  <span className="font-mono text-xl font-extrabold text-[#B82525]">
                    +{formatINR(data.additionalRevenueRecovered)}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[#E2D9C8] font-serif italic text-xs text-[#5A6578]">
                Proof point: Intelligent tone escalation, gateway retry, and guardrails prevent early drop-off.
              </div>
            </div>

          </div>

          {/* Batch Run Results output if available */}
          {batchResults && (
            <div className="ledger-card p-6 rounded-lg">
              <h3 className="font-serif font-bold text-lg text-[#0F2042] uppercase tracking-wider mb-4 border-b border-[#E2D9C8] pb-2">
                BATCH EXECUTION RESULTS ({batchResults.processedCount} CASES PROCESSED)
              </h3>
              <div className="max-h-60 overflow-y-auto space-y-2 font-mono text-xs">
                {batchResults.results.map((res, idx) => (
                  <div key={idx} className="p-2.5 bg-[#F8F4EA] border border-[#E2D9C8] rounded flex items-center justify-between">
                    <div>
                      <span className="font-bold text-[#0F2042]">Case #{res.caseId?.toString().slice(-8)}</span>
                      <span className="ml-2 text-[#5A6578]">• {res.recommendedAction}</span>
                      <p className="text-[11px] text-[#1A2B4C] mt-0.5">{res.reason}</p>
                    </div>
                    <span className="font-bold text-[#1E7E45]">{res.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

    </div>
  );
};
