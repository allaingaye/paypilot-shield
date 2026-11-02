import type { ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";

const VARIANTS = {
  // PayPal primary action: black pill
  primary:
    "bg-black text-white hover:bg-neutral-800 active:scale-[0.99] shadow-sm",
  // Secondary: white background + thin border
  secondary:
    "bg-white text-black border border-[#E6E7E8] hover:bg-[#F0F2F9]",
  // Ghost/link style
  ghost:
    "text-[#0070E0] hover:bg-[#F0F2F9]",
  // Destructive actions (Reject, Block)
  danger:
    "bg-[#C0212B] text-white hover:bg-[#a01a23] shadow-sm",
  // Small pill buttons used for prompt starters
  chip:
    "bg-white border border-[#E6E7E8] text-black hover:bg-gray-50 text-sm rounded-full",
} as const;

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof VARIANTS;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Button({
  variant = "primary",
  size = "md",
  loading,
  disabled,
  children,
  className = "",
  ...rest
}: Props) {
  const sizes = {
    sm: "h-9 px-4 text-sm",
    md: "h-11 px-6 text-sm font-medium",
    lg: "h-12 px-7 text-base font-medium",
  };

  // The chip variant has its own padding/height baked in, so we skip the size class
  const sizeClass = variant === "chip" ? "" : sizes[size];

  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-full
        transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0070E0]/40 focus-visible:ring-offset-2
        ${sizeClass} ${VARIANTS[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  );
}