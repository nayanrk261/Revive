import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { LedgerHeader } from './components/LedgerHeader';
import { Dashboard } from './pages/Dashboard';
import { RecoveryQueue } from './pages/RecoveryQueue';
import { CaseDetail } from './pages/CaseDetail';
import { BatchComparison } from './pages/BatchComparison';
import { OnboardingModal } from './components/OnboardingModal';

function MainApp() {
  const { user, demoMode, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedCaseId, setSelectedCaseId] = useState(null);
  const [showAuthPage, setShowAuthPage] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8EF] flex items-center justify-center font-mono text-[#5A6578]">
        <div className="text-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#D9383A] border-t-transparent rounded-full mb-4"></div>
          <p>Initializing Revive Revenue Ledger...</p>
        </div>
      </div>
    );
  }

  // Show AuthPage if not logged in and not in demo mode
  if (!user && !demoMode) {
    return <AuthPage onAuthSuccess={() => setShowAuthPage(false)} />;
  }

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('detail');
  };

  const handleBackToQueue = () => {
    setSelectedCaseId(null);
    setActiveTab('queue');
  };

  const isFirstTimeOnboarding = user && !user.onboardingComplete;

  return (
    <div className="min-h-screen bg-[#FBF8EF] text-[#0F2042] flex flex-col font-serif">
      
      {/* Onboarding modal sequence for new user accounts */}
      <OnboardingModal
        isOpen={isFirstTimeOnboarding}
        onComplete={() => setActiveTab('dashboard')}
        onSkipToDemo={() => setActiveTab('dashboard')}
      />

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
        onDataUploaded={() => {
          setActiveTab('queue');
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
            REVIVE — Autonomous AI Revenue Recovery Agent
          </p>
          <p className="mt-1 font-serif italic text-[11px]">
            Built for Razorpay AI Buildathon 2026 (Track 03: AI Revenue Recovery) • Powered by Multi-Step Tool-Calling Agent Loop, Guardrails Engine & Nodemailer Real Execution
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
