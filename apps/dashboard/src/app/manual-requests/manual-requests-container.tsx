"use client";

import { useState } from "react";
import { ManualRequestModal } from "./manual-request-modal";

interface ManualRequestsContainerProps {
  children?: React.ReactNode;
}

export function ManualRequestsContainer({ children }: ManualRequestsContainerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalKey, setModalKey] = useState(0);

  const handleOpen = () => {
    setModalKey((prev) => prev + 1);
    setIsModalOpen(true);
  };

  return (
    <>
      <div style={{ marginBottom: "20px" }}>
        <button
          type="button"
          className="btn-primary"
          onClick={handleOpen}
        >
          + Submit Manual Request
        </button>
      </div>

      <ManualRequestModal
        key={modalKey}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {children}
    </>
  );
}
