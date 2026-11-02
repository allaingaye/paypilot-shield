interface Props {
  size?: number;
  variant?: "dark" | "light"; // dark = on light bg, light = on dark bg
  withWordmark?: boolean;
}

export default function Logo({ size = 28, variant = "dark", withWordmark = true }: Props) {
  const bg = variant === "dark" ? "#002991" : "#FFFFFF";
  const fg = variant === "dark" ? "#FFFFFF" : "#002991";

  return (
    <div className="flex items-center gap-2.5">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        {/* Rounded square frame */}
        <rect width="32" height="32" rx="8" fill={bg} />
        {/* Stylized "P" formed by a chevron + bar */}
        <path
          d="M11 9.5h6.2c2.6 0 4.3 1.6 4.3 4.1 0 2.4-1.7 4-4.3 4h-3.7v5h-2.5V9.5zm2.5 2.2v3.7h3.4c1.2 0 2-.7 2-1.9 0-1.1-.8-1.8-2-1.8h-3.4z"
          fill={fg}
        />
        {/* Motion accent — a single forward tick */}
        <path d="M20.5 21l2 2 2-4" stroke={fg} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {withWordmark && (
        <span
          className={`text-[15px] font-semibold tracking-tight ${
            variant === "dark" ? "text-black" : "text-white"
          }`}
        >
          PayPilot
        </span>
      )}
    </div>
  );
}