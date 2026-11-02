import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { BadgeCheck, Hourglass, ShieldX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Button from "../components/Button";
import ErrorState from "../components/ErrorState";
import OpsGrid from "../components/OpsGrid";
import PageHeader from "../components/PageHeader";
import TotalPaidChart from "../components/TotalPaidChart";
import StatusBadge from "../components/StatusBadge";
import useApi from "../hooks/useApi";
import { api } from "../lib/api";
import { duration, money, reasonText, when } from "../lib/format";
import type { PaymentRequest, Reason, Transaction } from "../lib/types";

function Stat({ label, value, icon, color }: { label: string; value: ReactNode; icon: ReactNode; color: string }) {
  return (
    <div className="bg-white border border-[#E6E7E8] rounded-xl p-6 shadow-sm flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#686A6D] mb-1">{label}</p>
        <p className="text-2xl font-semibold text-black tabular-nums">{value}</p>
      </div>
      <span className={`w-12 h-12 shrink-0 ml-4 rounded-full flex items-center justify-center ${color}`}>
        {icon}
      </span>
    </div>
  );
}

export default function Payments() {
  const reqs = useApi<PaymentRequest[]>("/payments");
  const txns = useApi<Transaction[]>("/transactions");
  const [tab, setTab] = useState<"requests" | "payouts">("requests");

  const paid = useMemo(() => (txns.data ?? []).filter((t) => t.status === "SUCCESS").reduce((s, t) => s + t.amount, 0), [txns.data]);
  const awaiting = (reqs.data ?? []).filter((r) => r.status === "AWAITING_APPROVAL").length;
  const blocked = (reqs.data ?? []).filter((r) => r.status === "BLOCKED").length;

  // While a payout is PENDING, ask PayPal every 5 seconds.
  const rows = useRef<Transaction[]>([]);
  rows.current = txns.data ?? [];
  const polling = rows.current.some((t) => t.status === "PENDING");
  
  useEffect(() => {
    if (!polling) return;
    let tries = 0;
    const timer = setInterval(async () => {
      if (document.hidden) return;
      if (++tries > 24) return clearInterval(timer);
      const pending = rows.current.filter((t) => t.status === "PENDING");
      await Promise.allSettled(pending.map((t) => api(`/transactions/${t.id}/refresh`, { method: "POST", body: {} })));
      txns.reload();
      reqs.reload();
    }, 5000);
    return () => clearInterval(timer);
  }, [polling]); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = async (t: Transaction) => {
    await api(`/transactions/${t.id}/refresh`, { method: "POST", body: {} });
    txns.reload();
    reqs.reload();
  };

  const reqCols: ColDef<PaymentRequest>[] = [
    { field: "id", headerName: "ID", maxWidth: 90 },
    { field: "invoice", headerName: "Invoice", maxWidth: 130 },
    { field: "amount", headerName: "Amount", type: "rightAligned", maxWidth: 130, valueFormatter: (p) => money(p.value), cellClass: "money" },
    { field: "decision", headerName: "Decision", minWidth: 210, cellRenderer: (p: ICellRendererParams<PaymentRequest>) => <StatusBadge value={p.value} /> },
    { field: "risk", headerName: "Risk", minWidth: 165, cellRenderer: (p: ICellRendererParams<PaymentRequest>) => <StatusBadge value={p.value} /> },
    { field: "reasons", headerName: "Reasons", minWidth: 260, sortable: false,
      valueFormatter: (p) => { const r: Reason[] = p.value ?? []; return r.length ? reasonText(r[0]) + (r.length > 1 ? ` (+${r.length - 1})` : "") : ""; } },
    { field: "created_at", headerName: "Requested", minWidth: 190, valueFormatter: (p) => when(p.value) },
    { field: "status", headerName: "Status", minWidth: 210, cellRenderer: (p: ICellRendererParams<PaymentRequest>) => <StatusBadge value={p.value} /> },
    { headerName: "", maxWidth: 110, sortable: false, cellRenderer: (p: ICellRendererParams<PaymentRequest>) => p.data && <Link className="text-[#0070E0] font-medium hover:underline text-sm" to={`/replay/${p.data.id}`}>Replay</Link> },
  ];
  
  const txCols: ColDef<Transaction>[] = [
    { field: "invoice", headerName: "Invoice", maxWidth: 130 },
    { field: "amount", headerName: "Amount", type: "rightAligned", maxWidth: 130, valueFormatter: (p) => money(p.value, p.data?.currency), cellClass: "money" },
    { field: "status", headerName: "Status", minWidth: 150, cellRenderer: (p: ICellRendererParams<Transaction>) => <StatusBadge value={p.value} /> },
    { field: "payout_batch_id", headerName: "Batch id", minWidth: 160 },
    { field: "created_at", headerName: "Sent", minWidth: 190, valueFormatter: (p) => when(p.value) },
    { field: "completed_at", headerName: "Completed", minWidth: 190, valueFormatter: (p) => when(p.value) },
    { headerName: "Duration", minWidth: 120, sortable: false,
      valueGetter: (p) => p.data ? duration(p.data.created_at, p.data.completed_at) || (p.data.status === "PENDING" ? "pending" : "") : "" },
    { headerName: "", maxWidth: 130, sortable: false, cellRenderer: (p: ICellRendererParams<Transaction>) => p.data?.status === "PENDING" && <Button variant="secondary" className="!h-8" onClick={() => refresh(p.data!)}>Refresh</Button> },
  ];

  const err = reqs.error ?? txns.error;

  return (
    <div>
      <PageHeader note="the money trail" title="Payments" text="Every request and every payout, with its decision." />
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Stat 
          label="Paid Total" 
          value={txns.loading && !txns.data ? "-" : money(paid)} 
          color="bg-emerald-50 text-emerald-600" 
          icon={<BadgeCheck size={24} />} 
        />
        <Stat 
          label="Awaiting Approval" 
          value={reqs.loading && !reqs.data ? "-" : awaiting} 
          color="bg-amber-50 text-amber-600" 
          icon={<Hourglass size={24} />} 
        />
        <Stat 
          label="Blocked" 
          value={reqs.loading && !reqs.data ? "-" : blocked} 
          color="bg-red-50 text-red-600" 
          icon={<ShieldX size={24} />} 
        />
      </div>

      <TotalPaidChart txns={txns.data ?? []} />

      {/* Modern Tabs */}
      <div className="flex items-center gap-6 border-b border-[#E6E7E8] mb-6 mt-8">
        {(["requests", "payouts"] as const).map((t) => (
          <button 
            key={t} 
            onClick={() => setTab(t)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t 
                ? "border-[#0070E0] text-[#0070E0]" 
                : "border-transparent text-[#686A6D] hover:text-black hover:border-[#E6E7E8]"
            }`}
          >
            {t === "requests" ? "Payment Requests" : "Payouts"}
          </button>
        ))}
      </div>

      {err && <ErrorState message={err} onRetry={() => { reqs.reload(); txns.reload(); }} />}
      {polling && <p className="text-sm text-[#686A6D] mb-3" aria-live="polite">A payout is still pending. Checking PayPal every 5 seconds...</p>}
      
      {tab === "requests"
        ? <OpsGrid rows={reqs.error ? null : reqs.data} cols={reqCols} loading={reqs.loading} empty={{ note: "no payments yet", text: "Ask the agent to pay an invoice to see its decision here." }} />
        : <OpsGrid rows={txns.error ? null : txns.data} cols={txCols} loading={txns.loading} empty={{ note: "no payouts yet", text: "Payouts appear after a payment is sent to PayPal." }} />}
    </div>
  );
}