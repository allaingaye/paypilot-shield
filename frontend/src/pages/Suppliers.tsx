import type { ColDef, ICellRendererParams } from "ag-grid-community";
import { Plus, ShieldCheck, TriangleAlert, Building2 } from "lucide-react";
import { useEffect, useState } from "react";
import AddSupplierDrawer from "../components/AddSupplierDrawer";
import Banner from "../components/Banner";
import Button from "../components/Button";
import Drawer from "../components/Drawer";
import ErrorState from "../components/ErrorState";
import OpsGrid from "../components/OpsGrid";
import PageHeader from "../components/PageHeader";
import SigningModal from "../components/SigningModal";
import Skeleton from "../components/Skeleton";
import StatusBadge from "../components/StatusBadge";
import useApi from "../hooks/useApi";
import { api } from "../lib/api";
import { money, stepLabel, when } from "../lib/format";
import type { Supplier, SupplierAnalytics } from "../lib/types";

const differs = (s: Supplier) => !!s.last_payout_email && s.last_payout_email.toLowerCase() !== s.paypal_email.toLowerCase();

const cols: ColDef<Supplier>[] = [
  { field: "name", headerName: "Supplier Name", minWidth: 180 },
  { field: "country", headerName: "Country", maxWidth: 120 },
  { field: "paypal_email", headerName: "PayPal Email", minWidth: 240 },
  { field: "verified", headerName: "Status", maxWidth: 160,
    cellRenderer: (p: ICellRendererParams<Supplier>) => <StatusBadge value={p.value ? "VERIFIED" : "UNVERIFIED"} /> },
  { field: "last_payout_email", headerName: "Last Payout Email", minWidth: 240,
    cellRenderer: (p: ICellRendererParams<Supplier>) => p.data && differs(p.data)
      ? <span className="flex items-center gap-1.5 text-sm font-medium text-amber-600" title="Differs from the PayPal email on file"><TriangleAlert size={16} aria-hidden />{p.value}</span>
      : <span className="text-sm text-[#686A6D]">{p.value ?? "None yet"}</span> },
];

/** Modern Bar Chart aligned to PayPal colors */
function PayoutChart({ payments, median }: { payments: SupplierAnalytics["payments"]; median: number | null }) {
  if (payments.length === 0) return null;
  const W = 420, H = 160, pad = 32;
  const max = Math.max(...payments.map((p) => p.amount)) * 1.15;
  const y = (v: number) => H - pad - (v / max) * (H - pad * 2);
  const bw = Math.min(32, (W - pad * 2) / payments.length - 8);
  const x = (i: number) => pad + ((W - pad * 2) / payments.length) * (i + 0.5) - bw / 2;
  
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full mt-4" role="img"
      aria-label={`Payout amounts: ${payments.map((p) => `${p.invoice} ${money(p.amount, p.currency)}`).join(", ")}`}>
      <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} className="stroke-[#E6E7E8] stroke-2" />
      {payments.map((p, i) => (
        <g key={i}>
          <rect x={x(i)} y={y(p.amount)} width={bw} height={H - pad - y(p.amount)} className="fill-[#0070E0] rounded-t-sm" />
          <text x={x(i) + bw / 2} y={y(p.amount) - 6} textAnchor="middle" fontSize="10" className="fill-[#686A6D] font-medium">{money(p.amount, p.currency)}</text>
          <text x={x(i) + bw / 2} y={H - 10} textAnchor="middle" fontSize="10" className="fill-[#686A6D]">{p.invoice}</text>
        </g>
      ))}
      {median !== null && (
        <g>
          <line x1={pad} x2={W - pad} y1={y(median)} y2={y(median)} strokeDasharray="4 4" className="stroke-[#002991] opacity-50" />
          <text x={W - pad} y={y(median) - 6} textAnchor="end" fontSize="10" className="fill-[#002991] font-medium">median</text>
        </g>
      )}
    </svg>
  );
}

function Analytics({ id, onClose, onVerified }: { id: number; onClose: () => void; onVerified: () => void }) {
  const { data: a, loading, error, reload } = useApi<SupplierAnalytics>(`/suppliers/${id}/analytics`);
  const [signing, setSigning] = useState(false);
  const [payload, setPayload] = useState<string | null>(null);
  const [prepError, setPrepError] = useState<string | null>(null);
  
  useEffect(() => {
    if (!signing) return;
    api<{ payload: string }>(`/suppliers/${id}/verify-payload`).then((r) => setPayload(r.payload), () => setPrepError("Could not prepare the signing data."));
  }, [signing, id]);
  
  const closeSigning = () => { setSigning(false); setPayload(null); setPrepError(null); reload(); onVerified(); };

  return (
    <>
    <Drawer title={a?.supplier.name ?? "Supplier Profile"} onClose={onClose}>
      {loading && <Skeleton rows={3} />}
      {error && <Banner kind="error" title="Could not load this supplier">{error}</Banner>}
      {a && (
        <div className="space-y-6">
          
          {/* Header Action */}
          {!a.supplier.verified ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <TriangleAlert size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-amber-900">Unverified Supplier</h4>
                <p className="text-xs text-amber-700 mt-1 mb-3">This supplier has not been cryptographically signed. Payments will be blocked.</p>
                <Button onClick={() => setSigning(true)} size="sm" className="!bg-amber-600 hover:!bg-amber-700 !text-white">Verify Supplier</Button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-emerald-900">Verified Supplier</h4>
                <p className="text-xs text-emerald-700 mt-1">Identity confirmed. Invoices can be auto-approved up to policy limits.</p>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <dl className="grid grid-cols-2 gap-4">
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E6E7E8]">
              <dt className="text-xs text-[#686A6D] mb-1">Total Paid</dt>
              <dd className="text-lg font-semibold text-black tabular-nums">{money(a.paid_total)} <span className="text-sm font-normal text-[#686A6D]">({a.paid_count} payouts)</span></dd>
            </div>
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E6E7E8]">
              <dt className="text-xs text-[#686A6D] mb-1">Median Payout</dt>
              <dd className="text-lg font-semibold text-black tabular-nums">{a.paid_median === null ? "None" : money(a.paid_median)}</dd>
            </div>
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E6E7E8]">
              <dt className="text-xs text-[#686A6D] mb-1">Largest Payout</dt>
              <dd className="text-lg font-semibold text-black tabular-nums">{a.paid_max === null ? "None" : money(a.paid_max)}</dd>
            </div>
            <div className="bg-[#F9FAFB] p-3 rounded-lg border border-[#E6E7E8]">
              <dt className="text-xs text-[#686A6D] mb-1">Last Paid</dt>
              <dd className="text-sm font-medium text-black">{a.last_paid_at ? when(a.last_paid_at) : "Never"}</dd>
            </div>
          </dl>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <p className="text-xs font-semibold text-[#686A6D] uppercase tracking-wider mb-2">Invoices</p>
               <p className="text-sm font-medium text-black">{a.invoices}</p>
             </div>
             <div>
               <p className="text-xs font-semibold text-[#686A6D] uppercase tracking-wider mb-2">Flags Raised</p>
               <p className="text-sm text-black">{Object.entries(a.flags).map(([k, v]) => `${stepLabel(k)} (${v})`).join(", ") || "None"}</p>
             </div>
          </div>

          {/* Payment History Chart */}
          <div className="border border-[#E6E7E8] rounded-xl p-4 bg-white">
            <p className="text-xs font-semibold text-[#686A6D] uppercase tracking-wider mb-2">Payment History</p>
            <PayoutChart payments={a.payments} median={a.paid_median} />
            {a.payments.length === 0 ? <p className="text-sm text-[#686A6D] text-center py-4">No successful payouts yet.</p> : (
              <ul className="text-sm space-y-2 mt-4 pt-4 border-t border-[#E6E7E8]">
                {a.payments.map((p, i) => <li key={i} className="flex justify-between items-center"><span className="text-[#686A6D]">{p.invoice} · {when(p.at)}</span><span className="font-medium text-black tabular-nums">{money(p.amount, p.currency)}</span></li>)}
              </ul>
            )}
          </div>

          {/* Trust History */}
          <div>
            <p className="text-xs font-semibold text-[#686A6D] uppercase tracking-wider mb-2">Trust History</p>
            {a.events.length === 0 ? <p className="text-sm text-[#686A6D]">No changes recorded. Seeded suppliers start verified.</p> : (
              <ul className="text-sm space-y-2">
                {a.events.map((e, i) => <li key={i} className="flex items-center gap-2 text-[#686A6D]">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0070E0]" />
                  <span>{e.step === "supplier_created" ? "Added" : "Verified"}{e.by ? ` by ${e.by}` : ""}{e.signed ? " with a signature" : ""} · {when(e.at)}</span>
                </li>)}
              </ul>
            )}
          </div>

        </div>
      )}
    </Drawer>
    {signing && a && (
      <SigningModal title="Verify this supplier" confirmLabel="Sign and verify" payload={payload} prepError={prepError} onClose={closeSigning}
        summary={<p className="text-sm">You are trusting <strong>{a.supplier.name}</strong> ({a.supplier.country}). Once verified, its invoices are no longer blocked as unverified. Your signature covers this exact name, country and PayPal email.</p>}
        onConfirm={async (signature) => { await api(`/suppliers/${id}/verify`, { body: { signature } }); return <>{a.supplier.name} is now verified.</>; }} />
    )}
    </>
  );
}

export default function Suppliers() {
  const [open, setOpen] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const { data, loading, error, reload } = useApi<Supplier[]>("/suppliers");
  
  return (
    <div>
      <PageHeader note="who you pay" title="Suppliers" text="Verified suppliers and the email each one was last paid at."
        action={<Button onClick={() => setAdding(true)}><Plus size={16} /> Add Supplier</Button>} />
      
      {error && <ErrorState message={error} onRetry={reload} />}
      
      <OpsGrid 
        rows={error ? null : data} 
        cols={cols} 
        loading={loading} 
        onRowClicked={(r) => setOpen(r.id)} 
        empty={{ note: "no suppliers", text: "Seed the demo data to see suppliers." }} 
      />
      
      {open !== null && <Analytics id={open} onClose={() => setOpen(null)} onVerified={reload} />}
      {adding && <AddSupplierDrawer onClose={() => setAdding(false)} onCreated={() => { setAdding(false); reload(); }} />}
    </div>
  );
}