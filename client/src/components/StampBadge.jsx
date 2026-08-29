import React from 'react';

export const StampBadge = ({ status, text }) => {
  const displayStatus = (status || '').toLowerCase();

  let stampStyle = 'stamp-open';
  let label = text || status;

  if (displayStatus === 'recovered') {
    stampStyle = 'stamp-recovered';
    label = label || 'RECOVERED';
  } else if (displayStatus === 'escalated') {
    stampStyle = 'stamp-escalated';
    label = label || 'ESCALATED';
  } else if (displayStatus === 'stopped') {
    stampStyle = 'stamp-stopped';
    label = label || 'STOPPED';
  } else {
    stampStyle = 'stamp-open';
    label = label || 'OPEN';
  }

  return (
    <span className={`rubber-stamp ${stampStyle}`}>
      {label}
    </span>
  );
};
