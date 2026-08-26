import React from 'react';
import { ShieldCheck, RefreshCw, BarChart2, ListFilter, PlayCircle, Zap } from 'lucide-react';
import { reseedDatabase } from '../services/api';

export const LedgerHeader = ({ activeTab, setActiveTab, onReseed }) => {
  const [reseeding, setReseeding] = React.useState(false);

  const handleSeed = async () => {
    if (confirm('Re-seed database with 70 customers and 160 revenue events?')) {
      setReseeding(true);
      try {
        await reseedDatabase();
        if (onReseed) onReseed();
      } catch (err) {
        alert('Failed to reseed database: ' + err.message);
      } finally {
        setReseeding(false);
      }
    }
  };

  return (
    <header className="border-b-2 border-[#1A2B4C] bg-[#F6F1E5] shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo & Stamp Motif */}
          <div className="flex items-center space-x-3">
            <div className="bg-[#1A2B4C] text-[#F6F1E5] p-2.5 rounded border border-[#0F2042]">
              <ShieldCheck className="w-7 h-7 text-[#D9383A]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="font-serif font-extrabold text-2xl tracking-tight text-[#0F2042]">
                  REVIVE
                </h1>
                <span className="font-mono text-xs px-2 py-0.5 bg-[#D9383A] text-white rounded uppercase font-bold tracking-wider">
                  AI Revenue Agent
                </span>
              </div>
              <p className="font-serif italic text-xs text-[#5A6578]">
                Razorpay Buildathon — Track 03: AI Revenue Recovery
              </p>
            </div>
          </div>

          {/* Navigation Ledger Tabs */}
          <nav className="flex space-x-1 font-mono text-sm font-bold">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-t-2 rounded-t transition-all ${activeTab === 'dashboard'
                  ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042] shadow-sm'
                  : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
            >
              <BarChart2 className="w-4 h-4 text-[#D9383A]" />
              <span>DASHBOARD</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-t-2 rounded-t transition-all ${activeTab === 'queue'
                  ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042] shadow-sm'
                  : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
            >
              <ListFilter className="w-4 h-4 text-[#1E7E45]" />
              <span>RECOVERY QUEUE</span>
            </button>

            <button
              onClick={() => setActiveTab('batch')}
              className={`flex items-center space-x-2 px-4 py-2.5 border-t-2 rounded-t transition-all ${activeTab === 'batch'
                  ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042] shadow-sm'
                  : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
            >
              <Zap className="w-4 h-4 text-[#C67D0A]" />
              <span>BASELINE PROOF</span>
            </button>
          </nav>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSeed}
              disabled={reseeding}
              className="flex items-center space-x-1.5 font-mono text-xs px-3 py-2 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded font-bold transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
              <span>{reseeding ? 'SEEDING...' : 'RE-SEED DATA'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
