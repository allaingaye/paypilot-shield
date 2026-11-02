import { Bot, ChevronRight, PenLine, Send, User, Terminal } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import Button from "../components/Button";
import StatusBadge from "../components/StatusBadge";
import DecisionCard from "../components/DecisionCard";
import StepBlock from "../components/StepBlock";
import { refreshShell } from "../components/Shell";
import { ApiError, api } from "../lib/api";
import { money } from "../lib/format";
import type { AgentReply, AgentToolCall, PaymentSummary } from "../lib/types";

interface Msg { role: "user" | "agent"; text: string; reply?: AgentReply; error?: boolean; }

const STARTERS = [
  "Pay ABC Supplies for invoice INV-001",
  "Pay Global Services for invoice INV-003",
  "Why was INV-004 blocked?",
  "List all unpaid invoices",
];

const asRec = (v: unknown): Record<string, unknown> => (v && typeof v === "object" ? (v as Record<string, unknown>) : {});

function toolSummary(t: AgentToolCall): string {
  if (typeof t.output === "string") return t.output;
  const o = asRec(t.output);
  if (typeof o.error === "string") return o.error;
  switch (t.tool) {
    case "get_invoice": return `${o.supplier}, ${money(Number(o.amount))}, ${o.status}${o.supplier_verified === false ? ", supplier not verified" : ""}`;
    case "list_invoices": return `${Array.isArray(o.invoices) ? o.invoices.length : 0} invoices`;
    case "get_supplier": return `${o.name}, ${o.verified ? "verified" : "not verified"}, ${o.country}`;
    case "get_policy": return `Auto limit ${money(Number(o.auto_limit))}, budget ${money(Number(o.monthly_budget))}, ${o.signed ? "signed" : "not signed"}`;
    case "explain_request": return `${Array.isArray(o.events) ? o.events.length : 0} audit steps`;
    case "submit_payment_request": return o.note ? String(o.note) : `${o.decision}: ${o.status}`;
    default: return "Completed.";
  }
}

function Bold({ text }: { text: string }) {
  return <>{text.split(/(\*\*[^*\n]+\*\*)/).map((part, i) => part.startsWith("**") && part.endsWith("**") && part.length > 4
    ? <strong key={i} className="font-semibold text-black">{part.slice(2, -2)}</strong> : part)}</>;
}

const MODE = { rules: "Rules mode", llm: "AI mode", rules_fallback: "AI fallback to rules" } as const;

export default function AgentChat() {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = async (message: string) => {
    if (!message.trim() || busy) return;
    setMsgs((m) => [...m, { role: "user", text: message }]);
    setText("");
    setBusy(true);
    try {
      const reply = await api<AgentReply>("/agent/chat", { body: { message } });
      setMsgs((m) => [...m, { role: "agent", text: reply.reply, reply }]);
      refreshShell();
    } catch (e) {
      setMsgs((m) => [...m, { role: "agent", error: true, text: e instanceof ApiError ? e.detail : "I could not reach the server." }]);
    } finally {
      setBusy(false);
    }
  };

  const last = [...msgs].reverse().find((m) => m.reply)?.reply;
  const submit: PaymentSummary | undefined = last?.trace.find((t: AgentToolCall) => t.tool === "submit_payment_request")?.output as PaymentSummary | undefined;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-8rem)] gap-6">
      
      {/* LEFT COLUMN: Chat Interface */}
      <div className="flex-1 flex flex-col bg-white border border-[#E6E7E8] rounded-xl shadow-sm overflow-hidden">
        {/* Chat Header */}
        <div className="px-6 py-4 border-b border-[#E6E7E8] bg-white flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-black">AI Payment Agent</h1>
            <p className="text-xs text-[#686A6D] mt-0.5">Tell the agent what to pay. It handles the checks and executes via PayPal.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F0F2F9] text-xs font-medium text-[#002991]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0070E0] animate-pulse" />
            Sandbox Active
          </span>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {msgs.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
              <div className="w-12 h-12 rounded-full bg-[#F0F2F9] flex items-center justify-center mb-4">
                <Bot size={24} className="text-[#0070E0]" />
              </div>
              <h3 className="text-lg font-medium text-black">How can I help you today?</h3>
              <p className="text-sm text-[#686A6D] mt-1 mb-8">I can read invoices, check policies, and execute PayPal payments.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                {STARTERS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="text-left text-sm text-[#111] bg-white border border-[#E6E7E8] hover:bg-[#F0F2F9] hover:border-[#0070E0]/30 p-3 rounded-lg transition-all duration-150">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {msgs.map((m, i) => m.role === "user" ? (
            <div key={i} className="flex justify-end gap-3">
              <div className="bg-[#002991] text-white rounded-2xl rounded-tr-sm px-5 py-3 max-w-[85%] shadow-sm">
                <p className="text-sm leading-relaxed">{m.text}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#F0F2F9] border border-[#E6E7E8] flex items-center justify-center shrink-0">
                <User size={16} className="text-[#002991]" />
              </div>
            </div>
          ) : m.error ? (
            <div key={i} className="flex gap-3">
               <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                <Bot size={16} className="text-red-600" />
              </div>
              <div className="flex-1 max-w-[85%]">
                <Banner kind="error" title="Error">{m.text}</Banner>
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0070E0] flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={16} className="text-white" />
              </div>
              <div className="flex-1 max-w-[85%]">
                <div className="bg-[#F9FAFB] border border-[#E6E7E8] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm text-sm text-[#111] leading-relaxed whitespace-pre-wrap">
                  <Bold text={m.text} />
                </div>
                {m.reply && (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-[11px] font-medium text-[#686A6D] bg-[#F0F2F9] px-2 py-0.5 rounded border border-[#E6E7E8]">
                      {MODE[m.reply.mode]}
                    </span>
                    {m.reply.payment_request_id && (
                      <Link className="text-xs font-medium text-[#0070E0] hover:underline flex items-center gap-1" to={`/replay/${m.reply.payment_request_id}`}>
                        View audit trail <ChevronRight size={12} />
                      </Link>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && (
             <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0070E0] flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-[#F9FAFB] border border-[#E6E7E8] rounded-2xl rounded-tl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#0070E0] rounded-full animate-bounce" />
                <span className="w-1.5 h-1.5 bg-[#0070E0] rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 bg-[#0070E0] rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={end} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-[#E6E7E8]">
          <form onSubmit={(e: FormEvent) => { e.preventDefault(); void send(text); }} className="relative flex items-center">
            <input 
              className="w-full h-12 pl-4 pr-14 bg-[#F0F2F9] border border-transparent focus:border-[#0070E0] focus:bg-white rounded-xl text-sm transition-all outline-none" 
              value={text} 
              onChange={(e) => setText(e.target.value)} 
              placeholder="Ask the agent to pay an invoice..." 
            />
            <button 
              type="submit" 
              disabled={busy || !text.trim()}
              className="absolute right-2 p-2 bg-[#0070E0] text-white rounded-lg hover:bg-[#005EA6] disabled:opacity-50 transition-colors"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT COLUMN: Agent Reasoning (Audit Trail) */}
      <aside className="w-full lg:w-[420px] shrink-0 flex flex-col bg-white border border-[#E6E7E8] rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E6E7E8] bg-[#F9FAFB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal size={16} className="text-[#686A6D]" />
            <h2 className="text-sm font-semibold text-black">Agent Reasoning</h2>
          </div>
          {last && <StatusBadge value={submit?.decision || "PENDING"} />}
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {!last && (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <PenLine size={24} className="text-[#686A6D] mb-3 opacity-50" />
              <p className="text-sm text-[#686A6D]">Tool calls, policy checks, and risk assessments will appear here as the agent works.</p>
            </div>
          )}

          {submit?.decision && (
            <div className="bg-white border border-[#E6E7E8] rounded-lg p-4 shadow-sm mb-6">
              <h3 className="text-xs font-semibold text-[#686A6D] uppercase tracking-wider mb-3">Payment Summary</h3>
              <DecisionCard invoice={submit.invoice} amount={submit.amount} decision={submit.decision} risk={submit.risk} reasons={submit.reasons} tilt={0} />
            </div>
          )}

          {last?.trace.map((t, i) => (
            <StepBlock key={i} index={i} tab={t.tool} failed={t.tool === "llm_error"}>
              <p className="text-sm text-[#111] break-words font-medium">{toolSummary(t)}</p>
            </StepBlock>
          ))}
        </div>
      </aside>

    </div>
  );
}