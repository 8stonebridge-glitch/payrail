import React from 'react';
import { STATUS_CONFIG } from '../data/mockData';

const StatusBadge = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`badge ${config.tw}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
