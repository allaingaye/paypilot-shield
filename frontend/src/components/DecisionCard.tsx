import { CircleCheck, TriangleAlert, ShieldCheck } from "lucide-react";
import { money, reasonText } from "../lib/format";
import type { Decision, Reason, Risk } from "../lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  invoice: string;
  supplier?: string;
  amount: number;
  currency?: string;
  decision: Decision;
  risk: Risk;
  reasons: Reason[];
  /** 0.6 only on the Agent screen - we ignore it now for a clean look */
  tilt?: number;
}

const LEAD: Record<Decision, string> = {
  BLOCKED: "Payment Blocked",
  NEEDS_APPROVAL: "Approval Required",
  AUTO_PAY: "Auto-Approved",
};

export default function DecisionCard({ invoice, supplier, amount, currency, decision, risk, reasons }: Props) {
  const pass = decision === "AUTO_PAY";
  
  return (
    <div className="bg-white border border-[#E6E7E8] rounded-xl shadow-sm overflow-hidden">
      {/* Header section with amount */}
      <div className="p-5 border-b border-[#E6E7E8] bg-[#F9FAFB] flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#686A6D] uppercase tracking-wider mb-1">Invoice</p>
          <p className="text-lg font-semibold text-black leading-none">{invoice}</p>
          {supplier && <p className="text-sm text-[#686A6D] mt-1">{supplier}</p>}
        </div>
        <p className="text-2xl font-semibold text-black tabular-nums tracking-tight">
          {money(amount, currency)}
        </p>
      </div>

      {/* Body section with decision logic */}
      <div className="p-5">
        <div className="flex gap-2 flex-wrap mb-4">
          <StatusBadge value={decision} />
          <StatusBadge value={risk} />
        </div>

        <div className="flex items-center gap-2 mb-2">
          {pass ? <CircleCheck size={16} className="text-emerald-600" /> : <TriangleAlert size={16} className="text-amber-500" />}
          <p className="text-sm font-medium text-black">{LEAD[decision]}</p>
        </div>

        <ul className="space-y-2 ml-6">
          {reasons.map((r) => (
            <li key={r.code} className="text-sm text-[#686A6D] list-disc marker:text-[#E6E7E8]">
              {reasonText(r)}
            </li>
          ))}
        </ul>
      </div>

      {/* Footer security stamp */}
      <div className="px-5 py-3 bg-[#F0F2F9] border-t border-[#E6E7E8] flex items-center justify-center gap-2 text-xs font-medium text-[#686A6D]">
        <ShieldCheck size={14} className="text-[#0070E0]" />
        Decided by rules engine, not by AI
      </div>
    </div>
  );
}