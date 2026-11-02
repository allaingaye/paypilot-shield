import { AlertCircle, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ReactNode } from "react";

const KIND = {
  error:   { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-700",    icon: AlertCircle },
  warn:    { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  icon: AlertTriangle },
  success: { bg: "bg-emerald-50",border: "border-emerald-200",text: "text-emerald-800",icon: CheckCircle2 },
  info:    { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800",   icon: Info },
} as const;

interface Props {
  kind: keyof typeof KIND;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}

export default function Banner({ kind, title, children, action }: Props) {
  const { bg, border, text, icon: Icon } = KIND[kind];
  return (
    <div role={kind === "error" ? "alert" : "status"}
      className={`${bg} ${border} ${text} border rounded-lg px-4 py-3 flex gap-3 items-start`}>
      <Icon size={18} className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {children && <p className="text-sm opacity-80 mt-0.5">{children}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}