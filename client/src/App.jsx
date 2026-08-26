import React, { useState } from 'react';
import { LedgerHeader } from './components/LedgerHeader';
import { Dashboard } from './pages/Dashboard';
import { RecoveryQueue } from './pages/RecoveryQueue';
import { CaseDetail } from './pages/CaseDetail';
import { BatchComparison } from './pages/BatchComparison';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('detail');
  };

  const handleBackToQueue = () => {
    setSelectedCaseId(null);
    setActiveTab('queue');
  };

  return (
    <div className="min-h-screen bg-[#FBF8EF] text-[#0F2042] flex flex-col font-serif">
      {/* Accounting Ledger Top Header */}
      <LedgerHeader 
        activeTab={activeTab} 
        setActiveTab={(tab) => {
          setSelectedCaseId(null);
          setActiveTab(tab);
        }}
        onReseed={() => {
          setActiveTab('dashboard');
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'dashboard' && (
          <Dashboard 
            onSelectCase={handleSelectCase} 
            onNavigate={(tab) => setActiveTab(tab)} 
          />
        )}

        {activeTab === 'queue' && (
          <RecoveryQueue 
            onSelectCase={handleSelectCase} 
          />
        )}

        {activeTab === 'detail' && selectedCaseId && (
          <CaseDetail 
            caseId={selectedCaseId} 
            onBack={handleBackToQueue} 
          />
        )}

        {activeTab === 'batch' && (
          <BatchComparison />
        )}
      </main>

      {/* Ledger Footer */}
      <footer className="border-t-2 border-[#1A2B4C] bg-[#F6F1E5] py-6 text-center font-mono text-xs text-[#5A6578]">
        <div className="max-w-7xl mx-auto px-4">
          <p className="font-bold text-[#0F2042]">
            WAPAS — Autonomous AI Revenue Recovery Agent
          </p>
          <p className="mt-1 font-serif italic text-[11px]">
            Built for Razorpay AI Buildathon 2026 (Track 03: AI Revenue Recovery) • Powered by Multi-Step Tool-Calling Agent Loop & Guardrails Engine
          </p>
        </div>
      </footer>
    </div>
  );
}
