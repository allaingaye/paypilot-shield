import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { trapTab } from "../lib/focus";

export default function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    
    // Prevent background scrolling when drawer is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    
    return () => {
      opener?.focus();
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <aside 
        ref={ref} 
        tabIndex={-1} 
        role="dialog" 
        aria-modal="true" 
        aria-label={title}
        onKeyDown={(e) => { if (e.key === "Escape") onClose(); trapTab(e, ref.current); }} 
        onClick={(e) => e.stopPropagation()}
        className="relative h-full w-[500px] max-w-full bg-white shadow-2xl flex flex-col"
        style={{ animation: "slideIn 250ms cubic-bezier(0.16, 1, 0.3, 1)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E6E7E8] bg-[#F9FAFB]">
          <h2 className="text-lg font-semibold text-black tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            aria-label="Close"
            className="p-2 rounded-full text-[#686A6D] hover:bg-[#E6E7E8] hover:text-black transition-colors focus:outline-none focus:ring-2 focus:ring-[#0070E0]"
          >
            <X size={18} />
          </button>
        </div>
        
        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </aside>
    </div>
  );
}