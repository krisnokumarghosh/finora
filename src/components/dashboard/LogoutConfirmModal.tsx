"use client";

import { useEffect } from "react";
import { Loader2, LogOut, X } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  isLoggingOut: boolean;
  error?: string;
  userEmail?: string;
  onClose: () => void;
  onConfirm: () => void;
}

export default function LogoutConfirmModal({
  isOpen,
  isLoggingOut,
  error,
  userEmail,
  onClose,
  onConfirm,
}: LogoutConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoggingOut) {
        onClose();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isLoggingOut, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      onMouseDown={() => {
        if (!isLoggingOut) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-black/5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#F3F3EE] text-[#2C2C2C]">
              <LogOut size={18} />
            </div>
            <div>
              <h3
                id="logout-confirm-title"
                className="text-base font-bold text-black"
              >
                Log out of Finora?
              </h3>
              {userEmail && (
                <p className="truncate text-xs text-black/50">{userEmail}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            aria-label="Close logout confirmation"
            className="rounded-full p-1.5 text-black/40 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C] disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-black/70">
          You will be signed out of your current session and redirected to the
          login page. Any unsaved changes will not be preserved.
        </p>

        {error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="h-10 rounded-full border border-black/10 bg-white px-5 text-xs font-semibold text-black/70 transition-colors hover:border-black/25 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C] disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoggingOut}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[#2C2C2C] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#E6FB2D] hover:text-[#2C2C2C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C2C2C] focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {isLoggingOut ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={14} />
                Yes, log out
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
