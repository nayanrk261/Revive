import React from 'react';
import { Clock, Wrench, ShieldAlert, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { StampBadge } from './StampBadge';

export const CaseTimeline = ({ actions }) => {
  if (!actions || actions.length === 0) {
    return (
      <div className="ledger-card p-6 text-center text-[#5A6578] font-mono text-sm italic">
        No agent actions recorded yet for this case. Click "RUN AGENT ANALYSIS" to analyze context.
      </div>
    );
  }

  return (
    <div className="ledger-card p-6 rounded-lg">
      <h3 className="font-serif font-bold text-lg text-[#0F2042] uppercase tracking-wider mb-4 border-b border-[#E2D9C8] pb-2 flex items-center justify-between">
        <span>AGENT ACTION AUDIT TRAIL</span>
        <span className="font-mono text-xs text-[#D9383A] font-bold">{actions.length} ACTIONS LOGGED</span>
      </h3>

      <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-[#D9383A] before:opacity-30">
        {actions.map((act, index) => {
          const dateStr = new Date(act.timestamp || act.createdAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
          });

          const isGuardrail = act.tool?.includes('guardrail');
          const isReminder = act.tool?.includes('reminder');
          const isPayment = act.action?.includes('PAYMENT');

          return (
            <div key={act._id || index} className="relative pl-12 group">
              {/* Timeline marker node */}
              <div className={`absolute left-4 top-1.5 -translate-x-1/2 w-5 h-5 rounded-full border-2 flex items-center justify-between justify-center ${
                isGuardrail 
                  ? 'bg-[#B82525] border-white text-white' 
                  : isPayment 
                  ? 'bg-[#1E7E45] border-white text-white'
                  : 'bg-[#1A2B4C] border-white text-white'
              }`}>
                {isGuardrail ? (
                  <ShieldAlert className="w-3 h-3" />
                ) : isPayment ? (
                  <CheckCircle2 className="w-3 h-3" />
                ) : (
                  <Wrench className="w-3 h-3" />
                )}
              </div>

              {/* Action content card */}
              <div className="bg-[#FFFDF8] border border-[#E2D9C8] p-4 rounded shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#F0E6D4] pb-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs uppercase px-2 py-0.5 bg-[#1A2B4C] text-white rounded">
                      TOOL: {act.tool}
                    </span>
                    <span className="font-mono font-extrabold text-sm text-[#0F2042]">
                      {act.action}
                    </span>
                  </div>

                  <span className="font-mono text-xs text-[#5A6578] flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5 text-[#D9383A]" />
                    <span>{dateStr}</span>
                  </span>
                </div>

                {/* Plain language reason */}
                <p className="font-mono text-sm text-[#1A2B4C] leading-relaxed mb-3">
                  <strong className="text-[#0F2042]">Agent Explanation:</strong> {act.reason}
                </p>

                {/* Handwritten style Hinglish callout if reminder */}
                {act.reason?.includes('"') && (
                  <div className="bg-[#F8F4EA] border-l-4 border-[#C67D0A] p-3 rounded my-2">
                    <span className="font-serif text-xs uppercase font-bold text-[#C67D0A] block mb-1">
                      Hinglish Message Sent to Customer:
                    </span>
                    <p className="handwritten-note">
                      {act.reason.substring(act.reason.indexOf('"') + 1, act.reason.lastIndexOf('"')) || act.reason}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs font-mono text-[#5A6578] pt-1">
                  <span>Status: <strong className="uppercase text-[#1E7E45]">{act.result || 'success'}</strong></span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
