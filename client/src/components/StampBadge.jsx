import React from 'react';

export const StampBadge = ({ status, text }) => {
  const displayStatus = (status || '').toLowerCase();

  let stampStyle = 'stamp-open';
  let label = text || status;

  if (displayStatus === 'recovered') {
    stampStyle = 'stamp-recovered';
    label = label || 'RECOVERED';
  } else if (displayStatus === 'escalated' || displayStatus === 'high') {
    stampStyle = 'stamp-escalated';
    label = label || (displayStatus === 'high' ? 'HIGH RISK' : 'ESCALATED');
  } else if (displayStatus === 'stopped') {
    stampStyle = 'stamp-stopped';
    label = label || 'STOPPED';
  } else if (displayStatus === 'medium') {
    stampStyle = 'stamp-open';
    label = label || 'MED RISK';
  } else if (displayStatus === 'low') {
    stampStyle = 'stamp-recovered';
    label = label || 'LOW RISK';
  }

  return (
    <span className={`rubber-stamp ${stampStyle}`}>
      {label}
    </span>
  );
};
