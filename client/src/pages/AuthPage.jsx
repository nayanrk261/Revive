import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const AuthPage = ({ onAuthSuccess }) => {
  const { login, signup, enterDemoMode } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState('business');
  const [businessName, setBusinessName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        const res = await login(email, password);
        if (res.success && onAuthSuccess) {
          onAuthSuccess(res.user);
        }
      } else {
        const res = await signup({ name, email, password, accountType, businessName });
        if (res.success && onAuthSuccess) {
          onAuthSuccess(res.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = () => {
    enterDemoMode();
    if (onAuthSuccess) onAuthSuccess(null);
  };

  return (
    <div className="min-h-screen bg-[#FBF8EF] flex items-center justify-center p-4">
      <div className="ledger-paper max-w-lg w-full p-8 rounded-sm border-2 border-[#1A2B4C] relative">
        
        {/* Header Wordmark Logo */}
        <div className="border-b-2 border-[#1A2B4C] pb-4 mb-6">
          <div className="flex items-center space-x-2">
            <h1 className="font-serif font-extrabold text-3xl tracking-tight text-[#0F2042]">
              REVIVE
            </h1>
            <span className="font-mono text-xs px-2 py-0.5 bg-[#D9383A] text-white rounded-sm uppercase font-bold tracking-wider">
              AI Revenue Agent
            </span>
          </div>
          <p className="font-serif italic text-xs text-[#5A6578] mt-1">
            Razorpay Buildathon — Track 03: AI Revenue Recovery
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex font-mono text-sm font-bold border-b border-[#E2D9C8] mb-6">
          <button
            type="button"
            onClick={() => { setIsLogin(true); setError(null); }}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              isLogin ? 'border-[#D9383A] text-[#0F2042]' : 'border-transparent text-[#5A6578] hover:text-[#0F2042]'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => { setIsLogin(false); setError(null); }}
            className={`flex-1 py-2 text-center border-b-2 transition-all ${
              !isLogin ? 'border-[#D9383A] text-[#0F2042]' : 'border-transparent text-[#5A6578] hover:text-[#0F2042]'
            }`}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {error && (
          <div className="bg-[#FADBD8] border border-[#B82525] text-[#B82525] p-3 rounded-sm font-mono text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-[#5A6578] uppercase font-bold mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rohan Gupta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
                />
              </div>

              <div>
                <label className="block text-[#5A6578] uppercase font-bold mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('individual')}
                    className={`p-2.5 border rounded-sm font-bold transition-all text-center ${
                      accountType === 'individual' 
                        ? 'border-[#1A2B4C] bg-[#1A2B4C] text-white' 
                        : 'border-[#E2D9C8] bg-[#FFFDF8] text-[#5A6578]'
                    }`}
                  >
                    <span>INDIVIDUAL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('business')}
                    className={`p-2.5 border rounded-sm font-bold transition-all text-center ${
                      accountType === 'business' 
                        ? 'border-[#1A2B4C] bg-[#1A2B4C] text-white' 
                        : 'border-[#E2D9C8] bg-[#FFFDF8] text-[#5A6578]'
                    }`}
                  >
                    <span>BUSINESS</span>
                  </button>
                </div>
              </div>

              {accountType === 'business' && (
                <div>
                  <label className="block text-[#5A6578] uppercase font-bold mb-1">Business / Company Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Apex FinTech Solutions"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[#5A6578] uppercase font-bold mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
            />
          </div>

          <div>
            <label className="block text-[#5A6578] uppercase font-bold mb-1">Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#D9383A] hover:bg-[#B82525] text-white rounded-sm font-bold uppercase tracking-wider transition-all mt-4"
          >
            <span>{loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN TO REGISTER →' : 'CREATE ACCOUNT & START →')}</span>
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E2D9C8] text-center">
          <p className="font-serif italic text-xs text-[#5A6578] mb-3">
            Want to explore instantly without creating an account?
          </p>
          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full py-2.5 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded-sm font-mono text-xs font-bold transition-all"
          >
            <span>ENTER DEMO MODE (PRE-SEEDED DATA) →</span>
          </button>
        </div>

      </div>
    </div>
  );
};
