import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reseedDatabase } from '../services/api';
import { DataUploadModal } from './DataUploadModal';

export const LedgerHeader = ({ activeTab, setActiveTab, onReseed, onDataUploaded }) => {
  const { user, demoMode, logout } = useAuth();
  const [reseeding, setReseeding] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSeed = async () => {
    if (confirm('Re-seed database with 70 synthetic customers and 160 revenue events?')) {
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

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  const displayName = user
    ? (user.businessName || user.name)
    : 'Demo Mode (Pre-Seeded)';

  return (
    <>
      <header className="border-b-2 border-[#1A2B4C] bg-[#F6F1E5] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3 md:py-0 md:h-20">
            
            {/* Wordmark Logo — responsive sizing */}
            <div className="flex items-center space-x-3 min-w-0">
              <div className="min-w-0">
                <div className="flex items-center space-x-2">
                  <h1 className="font-serif font-extrabold text-xl md:text-2xl tracking-tight text-[#0F2042]">
                    REVIVE
                  </h1>
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#D9383A] text-white rounded-sm uppercase font-bold tracking-wider hidden sm:inline">
                    AI Revenue Agent
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#5A6578] flex items-center space-x-2 mt-0.5 min-w-0">
                  <span className="font-bold text-[#0F2042] max-w-[180px] md:max-w-none truncate">{displayName}</span>
                  {demoMode && (
                    <span className="bg-[#FEF6E6] text-[#C67D0A] px-1.5 py-0.2 border border-[#E2D9C8] rounded-sm text-[10px] uppercase font-bold shrink-0">
                      DEMO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Desktop Navigation Ledger Tabs — hidden below md */}
            <nav className="hidden md:flex space-x-1 font-mono text-sm font-bold">
              <button
                onClick={() => handleTabClick('dashboard')}
                className={`px-4 py-2.5 border-t-2 rounded-t-sm transition-all ${
                  activeTab === 'dashboard'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042]'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <span>DASHBOARD</span>
              </button>

              <button
                onClick={() => handleTabClick('queue')}
                className={`px-4 py-2.5 border-t-2 rounded-t-sm transition-all ${
                  activeTab === 'queue'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042]'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <span>RECOVERY QUEUE</span>
              </button>

              <button
                onClick={() => handleTabClick('batch')}
                className={`px-4 py-2.5 border-t-2 rounded-t-sm transition-all ${
                  activeTab === 'batch'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042]'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <span>BASELINE PROOF</span>
              </button>
            </nav>

            {/* Desktop Controls — hidden below md */}
            <div className="hidden md:flex items-center space-x-2">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="font-mono text-xs px-3.5 py-2 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded-sm font-bold transition-all"
              >
                <span>UPLOAD DATA</span>
              </button>

              <button
                onClick={handleSeed}
                disabled={reseeding}
                title="Re-seed synthetic dataset"
                className="font-mono text-xs px-3 py-2 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded-sm font-bold transition-all"
              >
                <span>{reseeding ? 'RE-SEEDING...' : 'RE-SEED'}</span>
              </button>

              <button
                onClick={logout}
                title="Logout / Switch Account"
                className="font-mono text-xs px-3 py-2 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#B82525] border border-[#BDB099] rounded-sm font-bold transition-all cursor-pointer"
              >
                <span>LOGOUT</span>
              </button>
            </div>

            {/* Mobile Menu Toggle — hidden at md and above */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden font-mono text-xs px-3 py-2 border border-[#BDB099] bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] rounded-sm font-bold transition-all tracking-wider"
            >
              {menuOpen ? 'CLOSE' : 'MENU'}
            </button>

          </div>
        </div>

        {/* Mobile Dropdown Panel — only visible when menu is open, hidden at md+ */}
        {menuOpen && (
          <div className="md:hidden border-t border-[#E2D9C8] bg-[#FAF6EC]">
            <div className="max-w-7xl mx-auto px-4 py-3 space-y-1">

              {/* Nav Tabs — stacked */}
              <div className="space-y-1 pb-3 border-b border-[#E2D9C8]">
                <button
                  onClick={() => handleTabClick('dashboard')}
                  className={`w-full text-left px-4 py-2.5 font-mono text-sm font-bold rounded-sm transition-all ${
                    activeTab === 'dashboard'
                      ? 'bg-[#FBF8EF] text-[#0F2042] border-l-4 border-l-[#D9383A]'
                      : 'text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                  }`}
                >
                  DASHBOARD
                </button>
                <button
                  onClick={() => handleTabClick('queue')}
                  className={`w-full text-left px-4 py-2.5 font-mono text-sm font-bold rounded-sm transition-all ${
                    activeTab === 'queue'
                      ? 'bg-[#FBF8EF] text-[#0F2042] border-l-4 border-l-[#D9383A]'
                      : 'text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                  }`}
                >
                  RECOVERY QUEUE
                </button>
                <button
                  onClick={() => handleTabClick('batch')}
                  className={`w-full text-left px-4 py-2.5 font-mono text-sm font-bold rounded-sm transition-all ${
                    activeTab === 'batch'
                      ? 'bg-[#FBF8EF] text-[#0F2042] border-l-4 border-l-[#D9383A]'
                      : 'text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                  }`}
                >
                  BASELINE PROOF
                </button>
              </div>

              {/* Action Buttons — stacked full-width */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => { setUploadModalOpen(true); setMenuOpen(false); }}
                  className="w-full font-mono text-xs px-4 py-2.5 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded-sm font-bold transition-all"
                >
                  UPLOAD DATA
                </button>

                <button
                  onClick={() => { handleSeed(); setMenuOpen(false); }}
                  disabled={reseeding}
                  className="w-full font-mono text-xs px-4 py-2.5 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded-sm font-bold transition-all"
                >
                  {reseeding ? 'RE-SEEDING...' : 'RE-SEED'}
                </button>

                <button
                  onClick={() => { logout(); setMenuOpen(false); }}
                  className="w-full font-mono text-xs px-4 py-2.5 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#B82525] border border-[#BDB099] rounded-sm font-bold transition-all"
                >
                  LOGOUT
                </button>
              </div>

            </div>
          </div>
        )}
      </header>

      {/* Ingestion Modal */}
      <DataUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        onSuccess={() => {
          setUploadModalOpen(false);
          if (onDataUploaded) onDataUploaded();
        }}
      />
    </>
  );
};
