import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface Props {
  index: number;
  tab: string;
  right?: ReactNode;
  failed?: boolean;
  children: ReactNode;
}

export default function StepBlock({ index, tab, right, failed, children }: Props) {
  return (
    <div className={`relative pl-6 pb-6 ${index === 0 ? "pt-2" : ""}`}>
      
      {/* Vertical Timeline Line (hidden on the last item) */}
      <div className="absolute left-[11px] top-8 bottom-0 w-px bg-[#E6E7E8]" aria-hidden />
      
      {/* Timeline Dot / Icon */}
      <div className={`absolute left-0 top-2 w-6 h-6 rounded-full border-2 bg-white flex items-center justify-center z-10 ${
        failed ? "border-red-500 text-red-500" : "border-[#0070E0] text-[#0070E0]"
      }`}>
        {failed ? <AlertCircle size={12} strokeWidth={3} /> : <CheckCircle2 size={12} strokeWidth={3} />}
      </div>

      {/* Main Card */}
      <div className="bg-white border border-[#E6E7E8] rounded-lg overflow-hidden shadow-sm ml-2">
        
        {/* Header */}
        <div className={`px-3 py-2 border-b flex items-center justify-between gap-3 ${
          failed ? "bg-red-50 border-red-100" : "bg-[#F9FAFB] border-[#E6E7E8]"
        }`}>
          <span className={`text-xs font-mono font-semibold ${
            failed ? "text-red-700" : "text-[#0070E0]"
          }`}>
            {tab}
          </span>
          {right && <span className="text-[11px] text-[#686A6D] font-mono">{right}</span>}
        </div>
        
        {/* Body */}
        <div className="px-4 py-3 text-sm text-black leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}