import { 
  Ban, 
  BadgeCheck, 
  CircleCheck, 
  CircleHelp, 
  CircleX, 
  Clock, 
  Gauge, 
  Hourglass, 
  PenLine, 
  Send, 
  ShieldAlert, 
  ShieldCheck, 
  ShieldX,
  Circle
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Modern pastel mapping with icons
const MAP: Record<string, { label: string; icon: LucideIcon; bg: string; text: string; border: string }> = {
  // Decisions
  AUTO_PAY: { label: "Auto-pay", icon: CircleCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  NEEDS_APPROVAL: { label: "Needs approval", icon: PenLine, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  BLOCKED: { label: "Blocked", icon: ShieldX, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  
  // Statuses
  PAID: { label: "Paid", icon: BadgeCheck, bg: "bg-blue-50", text: "text-[#0070E0]", border: "border-blue-200" },
  SUCCESS: { label: "Success", icon: BadgeCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SENT: { label: "Sent", icon: Send, bg: "bg-blue-50", text: "text-[#0070E0]", border: "border-blue-200" },
  PENDING: { label: "Pending", icon: Clock, bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  AWAITING_APPROVAL: { label: "Awaiting approval", icon: Hourglass, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  ACTIVE: { label: "Active", icon: CircleCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  REJECTED: { label: "Rejected", icon: Ban, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  EXPIRED: { label: "Expired", icon: Clock, bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  FAILED: { label: "Failed", icon: CircleX, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  
  // Risk
  LOW: { label: "Low risk", icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  MEDIUM: { label: "Medium risk", icon: Gauge, bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" },
  HIGH: { label: "High risk", icon: ShieldAlert, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
  
  // Trust
  VERIFIED: { label: "Verified", icon: ShieldCheck, bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  SIGNATURE_INVALID: { label: "Signature invalid", icon: ShieldAlert, bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
};

const titleCase = (s: string) => s.toLowerCase().replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

interface Props {
  value: string | null | undefined;
  /** Ignored in the new design. Kept for backward compatibility. */
  rotate?: number;
}

export default function StatusBadge({ value }: Props) {
  if (!value) return null;
  
  const m = MAP[value] ?? { 
    label: titleCase(value), 
    icon: CircleHelp, 
    bg: "bg-gray-100", 
    text: "text-gray-700", 
    border: "border-gray-200" 
  };
  
  const Icon = m.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${m.bg} ${m.text} ${m.border}`}
    >
      <Icon size={14} aria-hidden />
      {m.label}
    </span>
  );
}