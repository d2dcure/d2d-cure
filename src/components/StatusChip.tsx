import React from 'react';
import { Chip } from "@nextui-org/react";

interface StatusChipProps {
  status: 'in_progress' | 'pending_approval' | 'needs_revision' | 'approved' | 'awaiting_replication';
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const getChipProps = (status: string) => {
    switch (status) {
      case 'in_progress':
        return {
          className: "bg-[#06B7DB]/20 text-[#06B7DB]",
          children: "In Progress"
        };
      case 'pending_approval':
        return {
          color: "warning" as const,
          children: "Pending Approval"
        };
      case 'needs_revision':
        return {
          color: "danger" as const,
          children: "Needs Revision"
        };
      case 'approved':
        return {
          color: "success" as const,
          children: "Approved"
        };
      case 'awaiting_replication':
        return {
          color: "secondary" as const,
          children: "Awaiting Replication"
        };
      default:
        return {
          color: "default" as const,
          children: "Unknown Status"
        };
    }
  };

  const chipProps = getChipProps(status);

  return (
    <Chip
      size="sm"
      variant="flat"
      {...chipProps}
    />
  );
};

export default StatusChip; 