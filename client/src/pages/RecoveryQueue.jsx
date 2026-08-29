import React, { useEffect, useState } from 'react';
import { getEvents } from '../services/api';
import { StampBadge } from '../components/StampBadge';

export const RecoveryQueue = ({ onSelectCase }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEventsData = async () => {
    setLoading(true);
    try {
      const data = await getEvents(typeFilter, statusFilter);
      if (data.success) {
        setEvents(data.events);
      }
    } catch (err) {
      console.error('Failed to fetch events queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEventsData();
  }, [typeFilter, statusFilter]);

  const filteredEvents = events.filter(ev => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const customerName = ev.customerId?.name || '';
    const email = ev.customerId?.email || '';
    return customerName.toLowerCase().includes(q) || email.toLowerCase().includes(q) || ev._id.toLowerCase().includes(q);
  });

  const getTypeLabel = (type) => {
    switch (type) {
      case 'payment_failed': return 'Payment Failed';
      case 'cart_abandoned': return 'Cart Abandoned';
      case 'subscription_failed': return 'Subscription Failed';
      case 'invoice_overdue': return 'Invoice Overdue';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#E2D9C8] pb-4">
        <div>
          <h2 className="font-serif font-extrabold text-2xl text-[#0F2042]">RECOVERY QUEUE REGISTER</h2>
          <p className="font-mono text-xs text-[#5A6578]">All detected revenue disruptions logged across 4 core scenarios</p>
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          
          <div className="relative flex-1 sm:w-64">
            <input
              type="text"
              placeholder="Search customer, email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-mono text-xs px-3 py-2 w-full bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="font-mono text-xs px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
          >
            <option value="">All Disruption Types</option>
            <option value="payment_failed">Payment Failed</option>
            <option value="cart_abandoned">Cart Abandoned</option>
            <option value="subscription_failed">Subscription Failed</option>
            <option value="invoice_overdue">Invoice Overdue</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="font-mono text-xs px-3 py-2 bg-[#FFFDF8] border border-[#E2D9C8] rounded-sm focus:outline-none focus:border-[#1A2B4C]"
          >
            <option value="">All Statuses</option>
            <option value="open">Open Cases</option>
            <option value="recovered">Recovered</option>
            <option value="escalated">Escalated</option>
            <option value="stopped">Stopped</option>
          </select>

        </div>
      </div>

      {/* Ledger Register Table */}
      <div className="ledger-card rounded-sm overflow-hidden border border-[#E2D9C8]">
        {loading ? (
          <div className="p-12 text-center font-mono text-[#5A6578]">Loading queue records...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="p-12 text-center font-mono text-[#5A6578]">No revenue disruption records match filters.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left ledger-table">
              <thead className="bg-[#F8F4EA]">
                <tr>
                  <th className="py-3.5 px-4 text-xs">EVENT ID / DATE</th>
                  <th className="py-3.5 px-4 text-xs">TYPE</th>
                  <th className="py-3.5 px-4 text-xs">CUSTOMER & RELIABILITY</th>
                  <th className="py-3.5 px-4 text-xs text-right">AMOUNT</th>
                  <th className="py-3.5 px-4 text-xs text-center">RISK SCORE</th>
                  <th className="py-3.5 px-4 text-xs text-center">STATUS</th>
                  <th className="py-3.5 px-4 text-xs text-center">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EBDDC8]">
                {filteredEvents.map((ev) => {
                  const recCase = ev.case;
                  const customer = ev.customerId;
                  const reliabilityPct = Math.round((customer?.paymentHistory?.reliabilityScore || 0.7) * 100);

                  return (
                    <tr
                      key={ev._id}
                      onClick={() => recCase && onSelectCase(recCase._id)}
                      className="hover:bg-[#F8F4EA]/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-[#0F2042]">
                          #{ev._id.toString().slice(-8).toUpperCase()}
                        </div>
                        <div className="font-mono text-[11px] text-[#5A6578]">
                          {ev.ageInHours}h ago
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-[#EAE2D2] text-[#0F2042] rounded-sm">
                          {getTypeLabel(ev.type)}
                        </span>
                        {ev.failureReason && (
                          <span className="block font-mono text-[10px] text-[#D9383A] mt-1">
                            Reason: {ev.failureReason}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-serif font-bold text-sm text-[#0F2042]">
                          {customer?.name || 'Unknown Customer'}
                        </div>
                        <div className="font-mono text-[11px] text-[#5A6578] flex items-center space-x-2">
                          <span>{customer?.phone}</span>
                          <span>·</span>
                          <span className={`${reliabilityPct >= 80 ? 'text-[#1E7E45]' : reliabilityPct < 40 ? 'text-[#B82525]' : 'text-[#C67D0A]'}`}>
                            Reliability: {reliabilityPct}%
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-extrabold text-sm text-[#0F2042]">
                          ₹{ev.amount.toLocaleString('en-IN')}
                        </div>
                      </td>

                      {/* Plain text risk formatting: LEVEL (SCORE/100), no colored pill box */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-serif italic text-xs font-bold text-[#0F2042]">
                          {recCase?.riskLevel || 'MED'} <span className="text-[#5A6578] font-mono font-normal">({recCase?.riskScore || 50}/100)</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <StampBadge status={ev.status} />
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (recCase) onSelectCase(recCase._id);
                          }}
                          className="font-mono text-xs px-3 py-1 bg-[#1A2B4C] hover:bg-[#0F2042] text-white rounded-sm transition-all"
                        >
                          <span>INVESTIGATE →</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
