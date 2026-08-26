import React, { useEffect, useState } from 'react';
import { getDashboardMetrics, compareBaseline } from '../services/api';
import { RecoveryFunnel } from '../components/RecoveryFunnel';
import { IndianRupee, TrendingUp, AlertTriangle, CheckCircle, ShieldAlert, ArrowRight, Zap } from 'lucide-react';
import { StampBadge } from '../components/StampBadge';

export const Dashboard = ({ onSelectCase, onNavigate }) => {
  const [metrics, setMetrics] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [typeBreakdown, setTypeBreakdown] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardMetrics();
      if (data.success) {
        setMetrics(data.metrics);
        setFunnel(data.funnel);
        setTypeBreakdown(data.typeBreakdown);
      }
      const compData = await compareBaseline();
      if (compData.success) {
        setComparison(compData.comparison);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center font-mono text-[#5A6578]">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D9383A] border-t-transparent rounded-full mb-4"></div>
        <p>Loading Wapas AI Revenue Ledger...</p>
      </div>
    );
  }

  const formatINR = (val) => `₹${(val || 0).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8">
      
      {/* Hero Recovered Metric Banner */}
      <div className="ledger-paper p-8 rounded-xl border-2 border-[#1A2B4C] relative overflow-hidden shadow-lg">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center space-x-2 text-[#D9383A] font-mono text-sm uppercase font-bold tracking-wider mb-2">
              <TrendingUp className="w-5 h-5" />
              <span>TOTAL REVENUE RECOVERED BY AGENT</span>
            </div>
            <div className="font-mono text-5xl md:text-6xl font-extrabold text-[#0F2042] tracking-tight">
              {formatINR(metrics?.totalRecoveredAmount)}
            </div>
            <p className="font-serif italic text-sm text-[#1A2B4C] mt-2">
              Out of {formatINR(metrics?.totalAtRiskAmount)} total detected at-risk revenue ({metrics?.recoveryRatePct}% Recovery Rate)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="bg-[#FFFDF8] border-2 border-[#1A2B4C] p-4 rounded text-center shadow-xs">
              <div className="font-mono text-xs text-[#5A6578] uppercase font-bold">RECOVERY RATE</div>
              <div className="font-mono text-3xl font-extrabold text-[#1E7E45]">{metrics?.recoveryRatePct}%</div>
            </div>
            <div className="bg-[#FFFDF8] border-2 border-[#1A2B4C] p-4 rounded text-center shadow-xs">
              <div className="font-mono text-xs text-[#5A6578] uppercase font-bold">OPEN AT-RISK</div>
              <div className="font-mono text-3xl font-extrabold text-[#D9383A]">{formatINR(metrics?.totalOpenAmount)}</div>
            </div>
          </div>
        </div>

        {/* Rubber stamp watermark */}
        <div className="absolute right-4 bottom-2 opacity-15 pointer-events-none transform rotate-12">
          <span className="rubber-stamp stamp-recovered text-6xl">WAPAS RECOVERED</span>
        </div>
      </div>

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="ledger-card p-5 rounded-lg border-l-4 border-l-[#1A2B4C]">
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs text-[#5A6578] font-bold">TOTAL DISRUPTIONS</span>
            <AlertTriangle className="w-5 h-5 text-[#1A2B4C]" />
          </div>
          <div className="font-mono text-3xl font-extrabold mt-2 text-[#0F2042]">{metrics?.totalEventsCount}</div>
          <div className="font-serif italic text-xs text-[#5A6578] mt-1">Across 4 failure types</div>
        </div>

        <div className="ledger-card p-5 rounded-lg border-l-4 border-l-[#C67D0A]">
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs text-[#5A6578] font-bold">ACTIVE CASES</span>
            <ClockIcon className="w-5 h-5 text-[#C67D0A]" />
          </div>
          <div className="font-mono text-3xl font-extrabold mt-2 text-[#C67D0A]">{metrics?.openCasesCount}</div>
          <div className="font-serif italic text-xs text-[#5A6578] mt-1">Agent currently resolving</div>
        </div>

        <div className="ledger-card p-5 rounded-lg border-l-4 border-l-[#1E7E45]">
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs text-[#5A6578] font-bold">RECOVERED CASES</span>
            <CheckCircle className="w-5 h-5 text-[#1E7E45]" />
          </div>
          <div className="font-mono text-3xl font-extrabold mt-2 text-[#1E7E45]">{metrics?.recoveredCasesCount}</div>
          <div className="font-serif italic text-xs text-[#5A6578] mt-1">Full payment received</div>
        </div>

        <div className="ledger-card p-5 rounded-lg border-l-4 border-l-[#B82525]">
          <div className="flex justify-between items-start">
            <span className="font-mono text-xs text-[#5A6578] font-bold">ESCALATED CASES</span>
            <ShieldAlert className="w-5 h-5 text-[#B82525]" />
          </div>
          <div className="font-mono text-3xl font-extrabold mt-2 text-[#B82525]">{metrics?.escalatedCasesCount}</div>
          <div className="font-serif italic text-xs text-[#5A6578] mt-1">Guardrail or high risk escalation</div>
        </div>
      </div>

      {/* Recovery Funnel */}
      <RecoveryFunnel funnel={funnel} />

      {/* Baseline Comparison Proof Banner */}
      {comparison && (
        <div className="ledger-card p-6 rounded-lg bg-[#FAF6EC] border-2 border-[#C67D0A] relative">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <div className="flex items-center space-x-2 text-[#C67D0A] font-mono text-xs font-bold uppercase mb-1">
                <Zap className="w-4 h-4" />
                <span>BENCHMARK PROOF: RULES-ONLY VS WAPAS AI AGENT</span>
              </div>
              <h4 className="font-serif font-bold text-xl text-[#0F2042]">
                Wapas AI Agent recovers <span className="text-[#1E7E45]">+{comparison.liftPct}% more revenue</span> than standard rule engines.
              </h4>
              <p className="font-mono text-xs text-[#5A6578] mt-1">
                Rules-Only Baseline: {comparison.rulesOnly?.recoveryRatePct}% recovery · Wapas AI Agent: {comparison.wapasAgent?.recoveryRatePct}% recovery
              </p>
            </div>

            <button
              onClick={() => onNavigate('batch')}
              className="flex items-center space-x-2 font-mono text-xs px-5 py-3 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded font-bold transition-all shadow-md shrink-0"
            >
              <span>RUN FULL PROOF BENCHMARK</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Disruption Types Grid */}
      <div className="ledger-card p-6 rounded-lg">
        <h3 className="font-serif font-bold text-lg text-[#0F2042] uppercase tracking-wider mb-4 border-b border-[#E2D9C8] pb-2">
          REVENUE DISRUPTION TYPE BREAKDOWN
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-[#F8F4EA] border border-[#E2D9C8] rounded">
            <span className="font-mono text-xs font-bold text-[#D9383A] block mb-1">PAYMENT FAILED</span>
            <div className="font-mono text-2xl font-extrabold">{typeBreakdown?.payment_failed || 0}</div>
            <p className="font-serif italic text-xs text-[#5A6578] mt-1">Transaction declined / timeout</p>
          </div>

          <div className="p-4 bg-[#F8F4EA] border border-[#E2D9C8] rounded">
            <span className="font-mono text-xs font-bold text-[#C67D0A] block mb-1">CART ABANDONED</span>
            <div className="font-mono text-2xl font-extrabold">{typeBreakdown?.cart_abandoned || 0}</div>
            <p className="font-serif italic text-xs text-[#5A6578] mt-1">Added items but unpaid</p>
          </div>

          <div className="p-4 bg-[#F8F4EA] border border-[#E2D9C8] rounded">
            <span className="font-mono text-xs font-bold text-[#6B38AC] block mb-1">SUBSCRIPTION FAILED</span>
            <div className="font-mono text-2xl font-extrabold">{typeBreakdown?.subscription_failed || 0}</div>
            <p className="font-serif italic text-xs text-[#5A6578] mt-1">Recurring renewal failed</p>
          </div>

          <div className="p-4 bg-[#F8F4EA] border border-[#E2D9C8] rounded">
            <span className="font-mono text-xs font-bold text-[#1A2B4C] block mb-1">INVOICE OVERDUE</span>
            <div className="font-mono text-2xl font-extrabold">{typeBreakdown?.invoice_overdue || 0}</div>
            <p className="font-serif italic text-xs text-[#5A6578] mt-1">B2B receivables past due</p>
          </div>
        </div>
      </div>

    </div>
  );
};

const ClockIcon = (props) => (
  <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
    <path strokeWidth="2" d="M12 6v6l4 2"/>
  </svg>
);
