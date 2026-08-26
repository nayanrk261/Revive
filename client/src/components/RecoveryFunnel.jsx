import React from 'react';
import { Search, Activity, MessageSquare, CheckCircle } from 'lucide-react';

export const RecoveryFunnel = ({ funnel }) => {
  const detected = funnel?.detected || 0;
  const diagnosed = funnel?.diagnosed || 0;
  const contacted = funnel?.contacted || 0;
  const recovered = funnel?.recovered || 0;

  const stages = [
    { label: 'DETECTED', count: detected, icon: Search, color: 'border-[#1A2B4C] bg-[#EBF2FA] text-[#1A2B4C]' },
    { label: 'DIAGNOSED', count: diagnosed, icon: Activity, color: 'border-[#C67D0A] bg-[#FEF6E6] text-[#C67D0A]' },
    { label: 'CONTACTED', count: contacted, icon: MessageSquare, color: 'border-[#6B38AC] bg-[#F3ECFB] text-[#6B38AC]' },
    { label: 'RECOVERED', count: recovered, icon: CheckCircle, color: 'border-[#1E7E45] bg-[#EBF7F0] text-[#1E7E45]' }
  ];

  return (
    <div className="ledger-card p-6 rounded-lg mb-8">
      <h3 className="font-serif font-bold text-lg text-[#0F2042] uppercase tracking-wider mb-4 border-b border-[#E2D9C8] pb-2 flex items-center justify-between">
        <span>RECOVERY FUNNEL STAGES</span>
        <span className="font-mono text-xs text-[#5A6578] font-normal">Detect → Diagnose → Decide → Act → Track → Stop</span>
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stages.map((st, idx) => {
          const Icon = st.icon;
          const pct = detected > 0 ? ((st.count / detected) * 100).toFixed(0) : 0;
          return (
            <div key={idx} className={`p-4 rounded border-2 ${st.color} flex flex-col justify-between relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold tracking-wider">{st.label}</span>
                <Icon className="w-5 h-5 opacity-80" />
              </div>
              <div className="mt-2">
                <div className="font-mono font-bold text-3xl">{st.count}</div>
                <div className="font-serif italic text-xs mt-1 opacity-80">
                  {pct}% of detected cases
                </div>
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-gray-400 font-bold text-xl">
                  →
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
