import { useState } from "react";
import { Link } from "react-router-dom";
import ApprovalCard from "../components/ApprovalCard";
import Banner from "../components/Banner";
import EmptyState from "../components/EmptyState";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import { refreshShell } from "../components/Shell";
import SigningModal from "../components/SigningModal";
import Skeleton from "../components/Skeleton";
import StatusBadge from "../components/StatusBadge";
import useApi from "../hooks/useApi";
import { ApiError, api } from "../lib/api";
import PasswordPrompt from "../components/PasswordPrompt";
import { hasKeypair, registerKey } from "../lib/crypto";
import { money, reasonText } from "../lib/format";
import type { ApprovalItem, PaymentSummary } from "../lib/types";

export default function Approvals() {
  const { data, loading, error, reload } = useApi<ApprovalItem[]>("/approvals");
  const [signing, setSigning] = useState<ApprovalItem | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [missingKey, setMissingKey] = useState(false);
  const [askPassword, setAskPassword] = useState(false);

  const open = async (item: ApprovalItem) => {
    setMissingKey(!(await hasKeypair().catch(() => false)));
    setSigning(item);
  };

  const confirm = async (signature: string) => {
    const item = signing!;
    const r = await api<PaymentSummary>(`/approvals/${item.id}/approve`, { body: { signature } });
    reload();
    refreshShell();
    if (r.status === "BLOCKED") {
      throw new Error(`The verifier refused this payment: ${r.reasons.map(reasonText).join("; ")}`);
    }
    return (
      <div className="space-y-2">
        <StatusBadge value={r.status} />
        <p className="text-sm">{item.invoice} {r.status === "PAID" ? "was paid" : "was sent"}. <Link className="text-[#0070E0] hover:underline font-medium" to={`/replay/${r.payment_request_id}`}>View decision trace</Link></p>
      </div>
    );
  };

  const reject = async (item: ApprovalItem, reason: string) => {
    try {
      await api(`/approvals/${item.id}/reject`, { body: { reason } });
      setNotice(`${item.invoice} was rejected. No payment was made.`);
      reload();
      refreshShell();
    } catch (e) {
      setNotice(e instanceof ApiError ? e.detail : "Could not reject.");
    }
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <PageHeader 
        note="your decision" 
        title="Approvals" 
        text="Payments the rules engine sent to you. You sign the exact payment." 
      />
      
      {notice && <div className="mb-6"><Banner kind="info" title={notice} /></div>}
      
      {loading && !data && <Skeleton />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.length === 0 && <EmptyState note="nothing is waiting for you" text="Ask the agent to pay an invoice that requires human approval." />}
      
      <div className="space-y-6">
        {data?.map((a) => <ApprovalCard key={a.id} item={a} onSign={open} onReject={reject} />)}
      </div>

      {signing && (
        <SigningModal
          confirmLabel="Sign and approve"
          payload={signing.cart_payload}
          onClose={() => { setSigning(null); setNotice(null); }}
          onConfirm={confirm}
          summary={
            <div className="space-y-3 bg-[#F9FAFB] p-4 rounded-lg border border-[#E6E7E8]">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#686A6D]">Invoice</span>
                <span className="text-sm font-medium">{signing.invoice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[#686A6D]">Supplier</span>
                <span className="text-sm font-medium">{signing.supplier}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-[#E6E7E8]">
                <span className="text-sm font-medium">Total Amount</span>
                <span className="text-lg font-semibold tabular-nums">{money(signing.amount, signing.currency)}</span>
              </div>
              
              {missingKey && (
                <Banner kind="warn" title="This browser has no signing key" action={<button className="btn-secondary" onClick={() => setAskPassword(true)}>Create new key</button>}>
                  Create a new key to approve payments. You will need to sign the policy again.
                </Banner>
              )}
            </div>
          }
        />
      )}
      
      {askPassword && <PasswordPrompt title="Create a new signing key" onSubmit={async (pw) => { await registerKey(pw); setMissingKey(false); }} onClose={() => setAskPassword(false)} />}
    </div>
  );
}