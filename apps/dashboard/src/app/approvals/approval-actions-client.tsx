"use client";

import { useState } from "react";
import { approveRequest, rejectRequest, type RequestState } from "../manual-requests/actions";

export function ApprovalActionsClient({
  requestId,
  status
}: {
  requestId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<RequestState | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await approveRequest(requestId);
      setFeedback(res);
    } catch (err) {
      setFeedback({ error: err instanceof Error ? err.message : "Approval failed" });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    setFeedback(null);
    try {
      const res = await rejectRequest(requestId);
      setFeedback(res);
    } catch (err) {
      setFeedback({ error: err instanceof Error ? err.message : "Rejection failed" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
      {feedback?.error && (
        <span style={{ color: "#f87171", fontSize: "0.8rem", fontWeight: 500 }}>
          ⚠️ {feedback.error}
        </span>
      )}
      {feedback?.success && (
        <span style={{ color: "#4ade80", fontSize: "0.8rem", fontWeight: 500 }}>
          ✅ {feedback.success}
        </span>
      )}

      {status !== "APPROVED" && status !== "REJECTED" && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            type="button"
            disabled={loading}
            onClick={handleReject}
            style={{
              background: "rgba(248, 113, 113, 0.15)",
              color: "#f87171",
              border: "1px solid rgba(248, 113, 113, 0.3)",
              padding: "6px 14px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            Reject
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleApprove}
            style={{
              background: "linear-gradient(135deg, #8b5cf6, #7c3aed)",
              color: "#fff",
              border: "none",
              padding: "6px 16px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer"
            }}
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}
