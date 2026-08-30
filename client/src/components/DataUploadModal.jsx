import React, { useState } from 'react';
import { uploadIngestData } from '../services/api';

export const DataUploadModal = ({ isOpen, onClose, onSuccess }) => {
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  if (!isOpen) return null;

  const sampleCSV = `Customer Name, Amount, Disruption Type, Failure Reason, Age Hours
Kaveri Logistics, 185000, invoice_overdue, overdue_30_days, 120
Priya Sharma, 4999, subscription_failed, card_expired, 18
Aditya Patel, 12500, payment_failed, insufficient_balance, 4
Neha Verma, 1499, cart_abandoned, null, 8`;

  const handleInsertSample = () => {
    setRawText(sampleCSV);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!rawText.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await uploadIngestData(rawText);
      if (res.success) {
        setResult(res);
        if (onSuccess) onSuccess(res);
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Ingestion failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2042]/40">
      <div className="ledger-paper max-w-2xl w-full p-8 rounded-sm border-2 border-[#1A2B4C] relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 font-mono font-bold text-sm text-[#5A6578] hover:text-[#0F2042]"
        >
          ✕ CLOSE
        </button>

        {/* Modal Header */}
        <div className="border-b border-[#E2D9C8] pb-3 mb-4">
          <h3 className="font-serif font-extrabold text-xl text-[#0F2042]">
            REAL DATA INGESTION PIPELINE
          </h3>
          <p className="font-mono text-xs text-[#5A6578] mt-0.5">
            Paste raw ledger CSV text or payment notes. LLM agent will extract & score events automatically.
          </p>
        </div>

        {result ? (
          <div className="space-y-4 text-center py-4">
            <h4 className="font-serif font-bold text-xl text-[#1E7E45] uppercase tracking-wider">
              DATA SUCCESSFULLY INGESTED
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs my-4">
              <div className="bg-[#FFFDF8] p-3 rounded-sm border border-[#E2D9C8]">
                <span className="text-[#5A6578] block">RECORDS FOUND</span>
                <span className="font-bold text-lg text-[#0F2042]">{result.recordsFound}</span>
              </div>
              <div className="bg-[#FFFDF8] p-3 rounded-sm border border-[#E2D9C8]">
                <span className="text-[#5A6578] block">CUSTOMERS</span>
                <span className="font-bold text-lg text-[#1E7E45]">{result.customersCreated}</span>
              </div>
              <div className="bg-[#FFFDF8] p-3 rounded-sm border border-[#E2D9C8]">
                <span className="text-[#5A6578] block">TOTAL AT-RISK</span>
                <span className="font-bold text-lg text-[#D9383A]">₹{result.totalAtRisk?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <button
              onClick={() => { setResult(null); onClose(); }}
              className="px-6 py-2.5 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded-sm font-mono text-xs font-bold uppercase tracking-wider"
            >
              VIEW RECOVERY REGISTER →
            </button>
          </div>
        ) : (
          <form onSubmit={handleUpload} className="space-y-4 font-mono text-xs">
            
            {error && (
              <div className="bg-[#FADBD8] border border-[#B82525] text-[#B82525] p-3 rounded-sm">
                {error}
              </div>
            )}

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-[#5A6578] uppercase font-bold">
                  PASTE CSV OR RAW DISRUPTION NOTES
                </label>
                <button
                  type="button"
                  onClick={handleInsertSample}
                  className="text-[#D9383A] hover:underline text-[11px] font-bold"
                >
                  + Insert Sample CSV Data
                </button>
              </div>

              <textarea
                rows={7}
                required
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder={`Example 1 (CSV):\nCustomer Name, Amount, Disruption Type, Failure Reason\nRohan Gupta, 12500, payment_failed, insufficient_balance\n\nExample 2 (Pasted Notes):\nKaveri Logistics owes 1,85,000 for July invoice, past due by 5 days.`}
                className="w-full p-3 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C] font-mono leading-relaxed"
              />
            </div>

            <div className="flex justify-end space-x-3 pt-2 border-t border-[#E2D9C8]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#E2D9C8] hover:bg-[#D5C9B3] text-[#0F2042] rounded-sm font-bold"
              >
                CANCEL
              </button>

              <button
                type="submit"
                disabled={loading || !rawText.trim()}
                className="px-6 py-2 bg-[#D9383A] hover:bg-[#B82525] disabled:opacity-50 text-white rounded-sm font-bold uppercase tracking-wider"
              >
                <span>{loading ? 'EXTRACTING WITH LLM...' : 'INGEST & PROCESS DATA'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
