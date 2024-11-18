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
          className: "bg-[#E6F1FE] text-[#06B7DB]",
          children: "In Progress"
        };
      case 'pending_approval':
        return {
          className: "bg-[#FFF4CF] text-[#F5A524]",
          children: "Pending Approval"
        };
      case 'needs_revision':
        return {
          className: "bg-[#FEE7EF] text-[#F31260]",
          children: "Needs Revision"
        };
      case 'approved':
        return {
          className: "bg-[#D4F4D9] text-[#17C964]",
          children: "Approved"
        };
      case 'awaiting_replication':
        return {
          className: "bg-[#F4F4F5] text-[#000000]",
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