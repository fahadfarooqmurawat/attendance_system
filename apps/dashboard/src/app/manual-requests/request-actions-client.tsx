"use client";

import { useTransition } from "react";
import { approveRequest, rejectRequest } from "./actions";

interface RequestActionsClientProps {
  requestId: string;
  status: string;
}

export function RequestActionsClient({ requestId, status }: RequestActionsClientProps) {
  const [isPending, startTransition] = useTransition();

  if (!status.startsWith("PENDING")) {
    return <span className="muted" style={{ fontSize: "0.85rem" }}>—</span>;
  }

  const handleApprove = () => {
    startTransition(async () => {
      await approveRequest(requestId);
    });
  };

  const handleReject = () => {
    startTransition(async () => {
      await rejectRequest(requestId);
    });
  };

  return (
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <button
        type="button"
        className="btn-approve"
        onClick={handleApprove}
        disabled={isPending}
      >
        {isPending ? "..." : "Approve"}
      </button>
      <button
        type="button"
        className="btn-reject"
        onClick={handleReject}
        disabled={isPending}
      >
        {isPending ? "..." : "Reject"}
      </button>
    </div>
  );
}
