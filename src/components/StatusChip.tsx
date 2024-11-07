import { Chip } from "@nextui-org/react";

export type ProfileStatus = 
  | "In Progress"
  | "Pending Approval"
  | "Needs Revision"
  | "Approved"
  | "Awaiting Replication";

export type ChecklistStatus = 
  | "Complete"
  | "Incomplete";

type StatusChipProps = {
  status: ProfileStatus | ChecklistStatus;
};

const StatusChip = ({ status }: StatusChipProps) => {
  const getStatusColor = (status: ProfileStatus | ChecklistStatus) => {
    switch (status) {
      case "In Progress":
        return { bg: "bg-blue-100", text: "text-blue-500" };
      case "Pending Approval":
        return { bg: "bg-gray-100", text: "text-gray-500" };
      case "Needs Revision":
        return { bg: "bg-red-100", text: "text-red-500" };
      case "Approved":
        return { bg: "bg-green-100", text: "text-green-500" };
      case "Awaiting Replication":
        return { bg: "bg-yellow-100", text: "text-yellow-500" };
      case "Complete":
        return { bg: "bg-green-100", text: "text-green-500" };
      case "Incomplete":
        return { bg: "bg-yellow-100", text: "text-yellow-500" };
      default:
        return { bg: "bg-gray-100", text: "text-gray-500" };
    }
  };

  const { bg, text } = getStatusColor(status);

  return (
    <Chip className={`${bg} ${text}`} variant="flat">
      {status}
    </Chip>
  );
};

export default StatusChip; 