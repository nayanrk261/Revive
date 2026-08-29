import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { reseedDatabase } from '../services/api';
import { DataUploadModal } from './DataUploadModal';

export const LedgerHeader = ({ activeTab, setActiveTab, onReseed, onDataUploaded }) => {
  const { user, demoMode, logout } = useAuth();
  const [reseeding, setReseeding] = useState(false);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);

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

  const displayName = user
    ? (user.businessName || user.name)
    : 'Demo Mode (Pre-Seeded)';

  return (
    <>
      <header className="border-b-2 border-[#1A2B4C] bg-[#F6F1E5] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Wordmark Logo */}
            <div className="flex items-center space-x-3">
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="font-serif font-extrabold text-2xl tracking-tight text-[#0F2042]">
                    REVIVE
                  </h1>
                  <span className="font-mono text-xs px-2 py-0.5 bg-[#D9383A] text-white rounded-sm uppercase font-bold tracking-wider">
                    AI Revenue Agent
                  </span>
                </div>
                <div className="font-mono text-[11px] text-[#5A6578] flex items-center space-x-2 mt-0.5">
                  <span className="font-bold text-[#0F2042]">{displayName}</span>
                  {demoMode && (
                    <span className="bg-[#FEF6E6] text-[#C67D0A] px-1.5 py-0.2 border border-[#E2D9C8] rounded-sm text-[10px] uppercase font-bold">
                      DEMO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Ledger Tabs - Text Only */}
            <nav className="flex space-x-1 font-mono text-sm font-bold">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-4 py-2.5 border-t-2 rounded-t-sm transition-all ${
                  activeTab === 'dashboard'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042]'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <span>DASHBOARD</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`px-4 py-2.5 border-t-2 rounded-t-sm transition-all ${
                  activeTab === 'queue'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042]'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <span>RECOVERY QUEUE</span>
              </button>

              <button
                onClick={() => setActiveTab('batch')}
                className={`px-4 py-2.5 border-t-2 rounded-t-sm transition-all ${
                  activeTab === 'batch'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042]'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <span>BASELINE PROOF</span>
              </button>
            </nav>

            {/* Controls - Text Only */}
            <div className="flex items-center space-x-2">
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

          </div>
        </div>
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
