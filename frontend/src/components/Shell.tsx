import { 
  CreditCard, 
  FileText, 
  LogOut, 
  MessageSquare, 
  PenLine, 
  ScrollText, 
  Users, 
  ShieldCheck 
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout, userEmail } from "../hooks/useAuth";
import { getHealth } from "../hooks/useHealth";
import { api } from "../lib/api";
import type { ApprovalItem, Mandate } from "../lib/types";
import Banner from "./Banner";
import Button from "./Button";
import Logo from "./Logo";

const TABS = [
  { to: "/", label: "AI Agent", icon: MessageSquare, end: true },
  { to: "/approvals", label: "Approvals", icon: PenLine },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/invoices", label: "Invoices", icon: FileText },
  { to: "/suppliers", label: "Suppliers", icon: Users },
  { to: "/policy", label: "Policy", icon: ScrollText },
];

/** Pages call this after something that changes policy or approvals so the shell refreshes. */
export function refreshShell() {
  window.dispatchEvent(new Event("paypilot:refresh"));
}

export default function Shell() {
  const nav = useNavigate();
  const [mode, setMode] = useState<string>("");
  const [policy, setPolicy] = useState<Mandate | null | undefined>(undefined);
  const [pending, setPending] = useState(0);

  const load = useCallback(async () => {
    try {
      const [p, a] = await Promise.all([
        api<Mandate | null>("/mandates/active"), 
        api<ApprovalItem[]>("/approvals")
      ]);
      setPolicy(p);
      setPending(a.length);
    } catch { /* api() already handles 401 */ }
  }, []);

  useEffect(() => {
    getHealth().then((h) => setMode(h.paypal_mode)).catch(() => undefined);
    void load();
    const t = setInterval(load, 30000);
    window.addEventListener("paypilot:refresh", load);
    return () => { 
      clearInterval(t); 
      window.removeEventListener("paypilot:refresh", load); 
    };
  }, [load]);

  const invalid = !!policy && !policy.verified;

  return (
    <div className="min-h-screen flex bg-[#F0F2F9]">
      {/* Sidebar Navigation */}
      <aside className="w-[260px] bg-[#002991] text-white flex flex-col fixed inset-y-0 left-0 z-40">
        
        {/* Sidebar Header (Logo) */}
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Logo variant="light" size={28} />
        </div>
        
        {/* Navigation Links */}
        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {TABS.map(({ to, label, icon: Icon, end }) => (
            <NavLink 
              key={to} 
              to={to} 
              end={end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={18} />
              <span className="flex-1">{label}</span>
              {label === "Approvals" && pending > 0 && (
                <span className="bg-[#60CDFF] text-[#002991] text-xs font-bold px-2 py-0.5 rounded-full">
                  {pending}
                </span>
              )}
              {label === "Policy" && invalid && (
                <span className="w-2 h-2 rounded-full bg-red-500" aria-label="Policy invalid" />
              )}
            </NavLink>
          ))}
        </nav>

        {/* User Profile & Sign Out */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-medium shrink-0">
              {userEmail()?.charAt(0).toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{userEmail()}</p>
              <p className="text-xs text-[#60CDFF] flex items-center gap-1">
                <ShieldCheck size={12} /> {mode === "fake" ? "Fake Mode" : "Sandbox"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { logout(); nav("/login"); }} 
            className="flex items-center gap-2 text-sm text-white/60 hover:text-white w-full px-2 py-2 rounded-lg hover:bg-white/5 transition-colors"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[260px] flex flex-col min-h-screen">
        <div className="flex-1 p-8 lg:p-12 max-w-[1200px] w-full mx-auto">
          
          {/* Policy Warnings */}
          {invalid && (
            <div className="mb-6">
              <Banner kind="error" title="Policy signature is invalid" action={<Button variant="primary" onClick={() => nav("/policy")}>Review policy</Button>}>
                All payments are stopped until you sign a new policy.
              </Banner>
            </div>
          )}
          {policy === null && (
            <div className="mb-6">
              <Banner kind="warn" title="No active signed policy" action={<Button variant="primary" onClick={() => nav("/policy")}>Sign a policy</Button>}>
                Payments are refused until you sign one.
              </Banner>
            </div>
          )}
          
          {/* Page Content */}
          <Outlet />
        </div>
        
        {/* Footer */}
        <footer className="p-6 text-center border-t border-[#E6E7E8] mt-auto">
          <Link to="/privacy" className="text-xs text-[#686A6D] hover:text-black transition-colors">
            Privacy and terms
          </Link>
        </footer>
      </main>
    </div>
  );
}