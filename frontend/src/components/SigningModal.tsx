import { BadgeCheck, KeyRound, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ApiError } from "../lib/api";
import { signPayload } from "../lib/crypto";
import { trapTab } from "../lib/focus";
import Banner from "./Banner";
import Button from "./Button";
import CodeBlock from "./CodeBlock";

interface Props {
  title?: string;
  confirmLabel: string;
  summary: ReactNode;
  /** exact string to sign; null while the server is still preparing it */
  payload: string | null;
  /** sends the signature to the server, returns text for the sealed screen */
  onConfirm: (signature: string) => Promise<ReactNode>;
  onClose: () => void;
  prepError?: string | null;
}

type Phase = "idle" | "signing" | "sealed" | "failed";

export default function SigningModal({ title = "Sign with your key", confirmLabel, summary, payload, onConfirm, onClose, prepError }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ReactNode>(null);
  const box = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    box.current?.focus();
    
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      opener?.focus();
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape" && phaseRef.current !== "signing") onClose();
    trapTab(e, box.current);
  };

  const sign = async () => {
    if (!payload) return;
    setPhase("signing");
    setError(null);
    try {
      const signature = await signPayload(payload);
      setDone(await onConfirm(signature));
      setPhase("sealed");
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : e instanceof Error ? e.message : "Signing failed.");
      setPhase("failed");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity" onKeyDown={onKey}>
      <div 
        ref={box} 
        tabIndex={-1} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="sign-title"
        className="relative bg-white rounded-2xl shadow-2xl w-[560px] max-w-full overflow-hidden flex flex-col"
        style={{ animation: "modalIn 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {phase === "sealed" ? (
          <div className="p-10 text-center flex flex-col items-center" aria-live="polite">
            <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6 shadow-sm border border-emerald-100">
              <BadgeCheck size={40} className="text-emerald-600" aria-hidden />
            </div>
            <h2 className="text-2xl font-semibold text-black tracking-tight mb-2">Payment Authorized</h2>
            <div className="text-sm text-[#686A6D] mb-8">{done}</div>
            <Button variant="primary" className="w-full sm:w-auto min-w-[120px]" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 py-5 border-b border-[#E6E7E8] flex items-center gap-4 bg-[#F9FAFB]">
              <div className="w-12 h-12 rounded-full bg-[#0070E0]/10 flex items-center justify-center shrink-0 border border-[#0070E0]/20">
                <KeyRound size={24} className="text-[#0070E0]" aria-hidden />
              </div>
              <div>
                <h2 id="sign-title" className="text-lg font-semibold text-black">{title}</h2>
                <p className="text-xs text-[#686A6D] mt-0.5">Your private key never leaves this browser.</p>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
              {summary}
              
              <details className="group border border-[#E6E7E8] rounded-xl overflow-hidden bg-white">
                <summary className="px-4 py-3 text-sm font-medium text-[#686A6D] cursor-pointer hover:bg-gray-50 flex items-center justify-between select-none list-none [&::-webkit-details-marker]:hidden">
                  <span>Exact data you are signing</span>
                  <span className="text-xs text-gray-400 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="p-4 border-t border-[#E6E7E8] bg-[#F9FAFB] overflow-x-auto">
                  {payload ? <CodeBlock text={payload} /> : <p className="text-sm text-[#686A6D]">Preparing signature payload...</p>}
                </div>
              </details>

              {(prepError || (phase === "failed" && error)) && (
                <Banner kind="error" title="Could not complete signing">
                  {prepError ?? error}
                </Banner>
              )}
            </div>

            {/* Footer Actions */}
            <div className="px-6 py-4 border-t border-[#E6E7E8] bg-[#F9FAFB] flex justify-end gap-3">
              <Button variant="secondary" onClick={onClose} disabled={phase === "signing"}>
                Cancel
              </Button>
              <Button variant="primary" onClick={sign} loading={phase === "signing"} disabled={!payload}>
                {phase === "signing" ? "Signing..." : phase === "failed" ? "Try again" : confirmLabel}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}