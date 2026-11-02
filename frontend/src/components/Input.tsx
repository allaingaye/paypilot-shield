import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import { AlertCircle } from "lucide-react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helper?: string;
  error?: string | null;
}

export default function Input({ label, helper, error, className = "", ...rest }: Props) {
  const id = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-sm font-medium text-black">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-e` : helper ? `${id}-h` : undefined}
        className={`w-full h-11 px-3.5 rounded-lg border bg-white text-sm text-black
          placeholder:text-[#686A6D] transition-colors
          focus:outline-none focus:ring-2 focus:ring-[#0070E0]/30 focus:border-[#0070E0]
          ${error ? "border-[#C0212B]" : "border-[#E6E7E8] hover:border-neutral-400"}
          ${className}`}
        {...rest}
      />
      {helper && !error && (
        <p id={`${id}-h`} className="text-xs text-[#686A6D]">{helper}</p>
      )}
      {error && (
        <p id={`${id}-e`} role="alert" className="text-xs text-[#C0212B] flex items-center gap-1.5">
          <AlertCircle size={14} /> {error}
        </p>
      )}
    </div>
  );
}