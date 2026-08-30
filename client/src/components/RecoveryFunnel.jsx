import React from 'react';

export const RecoveryFunnel = ({ funnel }) => {
  const detected = funnel?.detected || 0;
  const diagnosed = funnel?.diagnosed || 0;
  const contacted = funnel?.contacted || 0;
  const recovered = funnel?.recovered || 0;

  const stages = [
    { num: '01', label: 'DETECTED', count: detected, highlight: false },
    { num: '02', label: 'DIAGNOSED', count: diagnosed, highlight: false },
    { num: '03', label: 'CONTACTED', count: contacted, highlight: false },
    { num: '04', label: 'RECOVERED', count: recovered, highlight: true }
  ];

  return (
    <div className="ledger-card p-6 rounded-sm mb-8">
      <div className="flex items-center justify-between border-b border-[#E2D9C8] pb-3 mb-6">
        <h3 className="font-serif font-bold text-lg text-[#0F2042] uppercase tracking-wider">
          RECOVERY FUNNEL REGISTER
        </h3>
        <span className="font-mono text-xs text-[#5A6578]">
          DETECT → DIAGNOSE → DECIDE → ACT → TRACK → STOP
        </span>
      </div>
      
      {/* Single Connected Paper Strip */}
      <div className="bg-[#F8F4EA] border border-[#D5C9B3] rounded-sm flex flex-col md:flex-row items-stretch">
        {stages.map((st, idx) => {
          const pct = detected > 0 ? ((st.count / detected) * 100).toFixed(0) : 0;
          return (
            <React.Fragment key={idx}>
              <div className="flex-1 p-4 md:p-5 flex flex-col justify-between relative">
                
                {/* Red Ink Folio Number */}
                <div className="flex items-center justify-between mb-3">
                  <span className="font-mono text-xs font-bold text-[#D9383A]">
                    FOLIO {st.num}
                  </span>
                  <span className="font-mono text-[11px] font-bold text-[#0F2042] tracking-wider uppercase">
                    {st.label}
                  </span>
                </div>

                {/* Big Count */}
                <div>
                  <div className={`font-mono text-4xl font-extrabold ${st.highlight ? 'text-[#1E7E45]' : 'text-[#0F2042]'}`}>
                    {st.count}
                  </div>
                  <div className="font-serif italic text-xs text-[#5A6578] mt-1">
                    {pct}% of total detected
                  </div>
                </div>

              </div>

              {/* Perforation divider line between segments — vertical on desktop, horizontal on mobile */}
              {idx < 3 && (
                <>
                  <div className="hidden md:block w-px bg-[#D5C9B3] my-3 border-r border-dashed border-[#BDB099]" />
                  <div className="md:hidden h-px bg-[#D5C9B3] mx-4 border-b border-dashed border-[#BDB099]" />
                </>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
