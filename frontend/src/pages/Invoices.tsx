import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { BadgeCheck, Plus, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Banner from "../components/Banner";
import Button from "../components/Button";
import Drawer from "../components/Drawer";
import NewInvoiceDrawer from "../components/NewInvoiceDrawer";
import ErrorState from "../components/ErrorState";
import OpsGrid from "../components/OpsGrid";
import PageHeader from "../components/PageHeader";
import { refreshShell } from "../components/Shell";
import StatusBadge from "../components/StatusBadge";
import useApi from "../hooks/useApi";
import { ApiError, api } from "../lib/api";
import { money, reasonText } from "../lib/format";
import type { Invoice, PaymentSummary, Supplier } from "../lib/types";

export default function Invoices() {
  const inv = useApi<Invoice[]>("/invoices");
  const sup = useApi<Supplier[]>("/suppliers");
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<Invoice | null>(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; id?: number } | null>(null);

  const lastPayout = useMemo(() => new Map((sup.data ?? []).map((s) => [s.name, s.last_payout_email])), [sup.data]);
  const mismatch = (i: Invoice) => {
    const last = lastPayout.get(i.supplier ?? "");
    return !!last && last.toLowerCase() !== i.payee_email.toLowerCase();
  };

  const statuses = ["ALL", ...Array.from(new Set((inv.data ?? []).map((i) => i.status)))];
  const rows = inv.data && inv.data.filter((i) => filter === "ALL" || i.status === filter);

  const cols: ColDef<Invoice>[] = [
    { field: "number", headerName: "Invoice #", maxWidth: 130 },
    { field: "supplier", headerName: "Supplier", minWidth: 170 },
    { field: "supplier_verified", headerName: "Verified", maxWidth: 120, sortable: false,
      cellRenderer: (p: ICellRendererParams<Invoice>) => p.value ? (
        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700"><BadgeCheck size={16} /> Verified</span>
      ) : (
        <span className="flex items-center gap-1.5 text-sm font-medium text-amber-700"><TriangleAlert size={16} /> Unverified</span>
      ) 
    },
    { field: "amount", headerName: "Amount", type: "rightAligned", maxWidth: 140,
      valueFormatter: (p) => money(p.value, p.data?.currency), cellClass: "money font-medium text-black" },
    { field: "status", headerName: "Status", minWidth: 210, cellRenderer: (p: ICellRendererParams<Invoice>) => <StatusBadge value={p.value} /> },
    { field: "payee_email", headerName: "Payee Email", minWidth: 340,
      cellRenderer: (p: ICellRendererParams<Invoice>) => p.data && mismatch(p.data)
        ? <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600" title="Differs from the supplier's last payout email"><TriangleAlert size={16} />{p.value}</span>
        : <span className="text-sm text-[#686A6D]">{p.value}</span> 
    },
  ];

  const request = async () => {
    if (!open) return;
    setBusy(true);
    setResult(null);
    try {
      const r = await api<PaymentSummary>("/payments", { body: { invoice_number: open.number } });
      setResult({ ok: r.status !== "BLOCKED", text: `${r.invoice}: ${r.note ?? r.reasons.map(reasonText).join("; ")} (${r.status})`, id: r.payment_request_id });
      inv.reload();
      refreshShell();
    } catch (e) {
      setResult({ ok: false, text: e instanceof ApiError ? e.detail : "Could not reach the server." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader note="your invoices" title="Invoices" text="Everything waiting to be paid. Open one to request payment."
        action={<Button onClick={() => setAdding(true)}><Plus size={16} /> New Invoice</Button>} />
      
      {inv.error && <ErrorState message={inv.error} onRetry={inv.reload} />}
      
      {/* Modern Filters */}
      {!inv.error && (
        <div className="flex gap-2 mb-6 flex-wrap" role="group" aria-label="Filter by status">
          {statuses.map((s) => (
            <button 
              key={s} 
              onClick={() => setFilter(s)} 
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${
                filter === s 
                  ? "bg-[#002991] text-white border-[#002991]" 
                  : "bg-white text-[#686A6D] border-[#E6E7E8] hover:bg-gray-50 hover:text-black"
              }`}
            >
              {s === "ALL" ? "All Invoices" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      )}

      <OpsGrid 
        rows={inv.error ? null : rows} 
        cols={cols} 
        loading={inv.loading} 
        onRowClicked={(r) => { setOpen(r); setResult(null); }}
        empty={{ note: "no invoices", text: "Nothing matches this filter." }} 
      />

      {adding && (
        <NewInvoiceDrawer 
          suppliers={sup.data ?? []} 
          onClose={() => setAdding(false)}
          onCreated={(i) => { setAdding(false); inv.reload(); setOpen(i); setResult(null); }} 
        />
      )}

      {open && (
        <Drawer title={open.number} onClose={() => setOpen(null)}>
          <div className="space-y-6">
            
            {/* Header Info */}
            <div>
              <p className="text-3xl font-semibold tracking-tight text-black tabular-nums mb-2">
                {money(open.amount, open.currency)}
              </p>
              <div className="flex gap-2 flex-wrap"><StatusBadge value={open.status} /></div>
            </div>

            {/* Details */}
            <dl className="text-sm space-y-2 bg-[#F9FAFB] p-4 rounded-xl border border-[#E6E7E8]">
              <div className="flex justify-between gap-4">
                <dt className="text-[#686A6D]">Supplier</dt>
                <dd className="font-medium text-black text-right">{open.supplier}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-[#686A6D]">Payee Email</dt>
                <dd className="font-medium text-black text-right break-all">{open.payee_email}</dd>
              </div>
            </dl>

            {mismatch(open) && (
              <Banner kind="warn" title="Payee email changed">
                This email differs from the supplier's last payout. Please verify before proceeding.
              </Banner>
            )}

            {/* Description */}
            <div className="rounded-xl border border-[#E6E7E8] bg-white p-4">
              <h4 className="text-xs font-semibold text-[#686A6D] uppercase tracking-wider mb-2">Description</h4>
              <p className="text-sm text-black break-words">{open.description}</p>
              <div className="mt-4 pt-3 border-t border-[#E6E7E8] flex items-start gap-2 text-xs text-[#686A6D]">
                <TriangleAlert size={14} className="shrink-0 mt-0.5 text-amber-500" />
                <p>Untrusted invoice text. Treated as data, never as instructions.</p>
              </div>
            </div>

            {result && (
              <Banner kind={result.ok ? "success" : "error"} title={result.text}>
                {result.id && <Link className="font-medium underline mt-1 inline-block" to={`/replay/${result.id}`}>View decision trace</Link>}
              </Banner>
            )}

            {/* Action */}
            <div className="pt-2">
              <Button 
                onClick={request} 
                loading={busy} 
                disabled={["PAID", "SENT"].includes(open.status)}
                className="w-full"
                size="lg"
              >
                Request Payment
              </Button>
            </div>
            
          </div>
        </Drawer>
      )}
    </div>
  );
}