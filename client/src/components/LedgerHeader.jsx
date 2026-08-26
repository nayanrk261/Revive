import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, BarChart2, ListFilter, Zap, Upload, LogOut, User, Building2 } from 'lucide-react';
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
      <header className="border-b-2 border-[#1A2B4C] bg-[#F6F1E5] shadow-sm sticky top-0 z-40">
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
                <div className="font-mono text-[11px] text-[#5A6578] flex items-center space-x-2">
                  {user?.accountType === 'business' ? <Building2 className="w-3 h-3 text-[#1A2B4C]" /> : <User className="w-3 h-3 text-[#1A2B4C]" />}
                  <span className="font-bold text-[#0F2042]">{displayName}</span>
                  {demoMode && (
                    <span className="bg-[#FEF6E6] text-[#C67D0A] px-1.5 py-0.2 border border-[#E2D9C8] rounded text-[10px] uppercase font-bold">
                      DEMO
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Navigation Ledger Tabs */}
            <nav className="flex space-x-1 font-mono text-sm font-bold">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-t-2 rounded-t transition-all ${
                  activeTab === 'dashboard'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042] shadow-sm'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <BarChart2 className="w-4 h-4 text-[#D9383A]" />
                <span>DASHBOARD</span>
              </button>

              <button
                onClick={() => setActiveTab('queue')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-t-2 rounded-t transition-all ${
                  activeTab === 'queue'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042] shadow-sm'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <ListFilter className="w-4 h-4 text-[#1E7E45]" />
                <span>RECOVERY QUEUE</span>
              </button>

              <button
                onClick={() => setActiveTab('batch')}
                className={`flex items-center space-x-2 px-4 py-2.5 border-t-2 rounded-t transition-all ${
                  activeTab === 'batch'
                    ? 'border-[#D9383A] bg-[#FBF8EF] text-[#0F2042] shadow-sm'
                    : 'border-transparent text-[#5A6578] hover:text-[#0F2042] hover:bg-[#EAE2D2]'
                }`}
              >
                <Zap className="w-4 h-4 text-[#C67D0A]" />
                <span>BASELINE PROOF</span>
              </button>
            </nav>

            {/* Controls */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setUploadModalOpen(true)}
                className="flex items-center space-x-1.5 font-mono text-xs px-3 py-2 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded font-bold transition-all shadow-xs"
              >
                <Upload className="w-3.5 h-3.5 text-[#D9383A]" />
                <span>UPLOAD DATA</span>
              </button>

              <button
                onClick={handleSeed}
                disabled={reseeding}
                title="Re-seed synthetic dataset"
                className="flex items-center space-x-1 font-mono text-xs px-2.5 py-2 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded font-bold transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reseeding ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={logout}
                title="Logout / Switch Account"
                className="flex items-center space-x-1.5 font-mono text-xs px-3 py-2 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#B82525] border border-[#BDB099] rounded font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
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
