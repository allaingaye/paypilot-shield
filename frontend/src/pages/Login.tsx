import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Banner from "../components/Banner";
import Button from "../components/Button";
import Input from "../components/Input";
import Logo from "../components/Logo";
import { login } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import { FileSearch, ShieldCheck, UserCheck } from "lucide-react";

export default function Login() {
  const nav = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("owner@paypilot.demo");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(
    params.get("expired") ? "Your session expired. Sign in again to continue." : null
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      nav("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Could not reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left: brand panel */}
      <div className="hidden lg:flex flex-col justify-between bg-[#002991] text-white p-12">
        <Logo variant="light" size={32} />

        <div className="space-y-10 max-w-md">
          <h1 className="text-[32px] leading-[1.15] font-semibold tracking-tight">
            Payment operations,<br />on autopilot — with guardrails.
          </h1>

          {/* The 3-beat mental model */}
          <ul className="space-y-6 text-sm text-white/75">
            <li className="flex gap-3">
              <FileSearch size={18} className="mt-0.5 shrink-0 text-[#60CDFF]" />
              <div>
                <p className="text-white font-medium">AI proposes</p>
                <p className="mt-1">Reads invoices, suppliers, and policies from plain English.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#60CDFF]" />
              <div>
                <p className="text-white font-medium">Rules decide</p>
                <p className="mt-1">Deterministic checks enforce budget and risk limits.</p>
              </div>
            </li>
            <li className="flex gap-3">
              <UserCheck size={18} className="mt-0.5 shrink-0 text-[#60CDFF]" />
              <div>
                <p className="text-white font-medium">You approve</p>
                <p className="mt-1">Sensitive payments always need a human in the loop.</p>
              </div>
            </li>
          </ul>
        </div>

        <p className="text-xs text-white/40">
          PayPal Sandbox · No real money moves
        </p>
      </div>

      {/* Right: form */}
      <div className="flex flex-col items-center justify-center p-6 bg-white">
        {/* Mobile-only logo */}
        <div className="lg:hidden mb-8">
          <Logo variant="dark" size={32} />
        </div>

        <form onSubmit={submit} className="w-full max-w-sm space-y-5">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-black">Sign in</h2>
            <p className="text-sm text-[#686A6D]">
              Access your payment operations console.
            </p>
          </div>

          {error && <Banner kind="error" title={error} />}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="username"
            placeholder="you@company.com"
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <Button type="submit" loading={busy} className="w-full" size="lg">
            Sign in
          </Button>

          <p className="text-xs text-[#686A6D] text-center">
            <Link to="/privacy" className="text-[#0070E0] hover:underline">
              Privacy and terms
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}