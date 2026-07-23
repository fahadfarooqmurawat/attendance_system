"use client";

import { useState } from "react";
import { ManualRequestModal } from "./manual-request-modal";

interface ManualRequestsContainerProps {
  children?: React.ReactNode;
}

export function ManualRequestsContainer({ children }: ManualRequestsContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className="btn-primary"
          onClick={() => setIsModalOpen(true)}
        >
          + Submit Manual Request
        </button>
      </div>

      <ManualRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {children}
    </>
  );
}
