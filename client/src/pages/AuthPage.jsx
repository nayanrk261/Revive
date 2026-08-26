import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ArrowRight, UserCheck, Building2, PlayCircle, Lock, Mail, User as UserIcon } from 'lucide-react';

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
      <div className="ledger-paper max-w-lg w-full p-8 rounded-xl border-2 border-[#1A2B4C] shadow-2xl relative overflow-hidden">
        
        {/* Header Logo */}
        <div className="flex items-center space-x-3 mb-6 border-b-2 border-[#1A2B4C] pb-4">
          <div className="bg-[#1A2B4C] text-[#F6F1E5] p-2.5 rounded border border-[#0F2042]">
            <ShieldCheck className="w-8 h-8 text-[#D9383A]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-serif font-extrabold text-3xl tracking-tight text-[#0F2042]">
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
          <div className="bg-[#FADBD8] border border-[#B82525] text-[#B82525] p-3 rounded font-mono text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-[#5A6578] uppercase font-bold mb-1">Your Full Name</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6578]" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohan Gupta"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded focus:outline-none focus:border-[#1A2B4C]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#5A6578] uppercase font-bold mb-1">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('individual')}
                    className={`flex items-center justify-center space-x-2 p-2.5 border rounded font-bold transition-all ${
                      accountType === 'individual' 
                        ? 'border-[#1A2B4C] bg-[#1A2B4C] text-white shadow-xs' 
                        : 'border-[#E2D9C8] bg-[#FFFDF8] text-[#5A6578]'
                    }`}
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>INDIVIDUAL</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountType('business')}
                    className={`flex items-center justify-center space-x-2 p-2.5 border rounded font-bold transition-all ${
                      accountType === 'business' 
                        ? 'border-[#1A2B4C] bg-[#1A2B4C] text-white shadow-xs' 
                        : 'border-[#E2D9C8] bg-[#FFFDF8] text-[#5A6578]'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
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
                    className="w-full px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded focus:outline-none focus:border-[#1A2B4C]"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-[#5A6578] uppercase font-bold mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6578]" />
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded focus:outline-none focus:border-[#1A2B4C]"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#5A6578] uppercase font-bold mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#5A6578]" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded focus:outline-none focus:border-[#1A2B4C]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 py-3 bg-[#D9383A] hover:bg-[#B82525] text-white rounded font-bold uppercase tracking-wider transition-all shadow-md mt-4"
          >
            <span>{loading ? 'PROCESSING...' : (isLogin ? 'SIGN IN TO REGISTER' : 'CREATE ACCOUNT & START')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#E2D9C8] text-center">
          <p className="font-serif italic text-xs text-[#5A6578] mb-3">
            Want to explore instantly without creating an account?
          </p>
          <button
            type="button"
            onClick={handleDemoClick}
            className="w-full flex items-center justify-center space-x-2 py-2.5 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] border border-[#BDB099] rounded font-mono text-xs font-bold transition-all shadow-xs"
          >
            <PlayCircle className="w-4 h-4 text-[#D9383A]" />
            <span>ENTER DEMO MODE (PRE-SEEDED DATA)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
