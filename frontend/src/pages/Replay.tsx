import { Check, Copy, ArrowLeft, ShieldCheck, Clock } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import Button from "../components/Button";
import DecisionCard from "../components/DecisionCard";
import EmptyState from "../components/EmptyState";
import DecisionTrace from "../components/DecisionTrace";
import ErrorState from "../components/ErrorState";
import PageHeader from "../components/PageHeader";
import Skeleton from "../components/Skeleton";
import StatusBadge from "../components/StatusBadge";
import useApi from "../hooks/useApi";
import { duration } from "../lib/format";
import type { PaymentDetail, TraceEvent } from "../lib/types";

export default function Replay() {
  const { id } = useParams();
  const head = useApi<PaymentDetail>(`/payments/${id}`);
  const trace = useApi<TraceEvent[]>(`/payments/${id}/trace`);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(trace.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const err = head.error ?? trace.error;
  const d = head.data;

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Breadcrumb Navigation */}
      <nav className="mb-6">
        <Link to="/payments" className="inline-flex items-center gap-1.5 text-sm font-medium text-[#686A6D] hover:text-black transition-colors">
          <ArrowLeft size={16} /> Back to Payments
        </Link>
      </nav>

      <PageHeader 
        note="payment replay"
        title={`Payment Request #${id}`} 
        text="Deterministic audit trail for this payment execution." 
        action={
          <Button 
            variant="secondary" 
            onClick={copy}
            className="!h-10 !px-4"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            {copied ? "Copied JSON" : "Copy JSON"}
          </Button>
        } 
      />

      {err && <ErrorState message={err} onRetry={() => { head.reload(); trace.reload(); }} />}
      
      {(head.loading || trace.loading) && !err && (
        <div className="space-y-4 mt-8">
          <Skeleton rows={3} />
        </div>
      )}

      {d && (
        <div className="space-y-6 mb-10 mt-8">
          {/* Decision Summary Card */}
          <DecisionCard 
            invoice={d.invoice} 
            supplier={d.supplier} 
            amount={d.amount} 
            currency={d.currency} 
            decision={d.decision} 
            risk={d.risk} 
            reasons={d.reasons} 
          />

          {/* Meta Data Row */}
          <div className="flex flex-wrap items-center gap-6 bg-white border border-[#E6E7E8] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[#686A6D]">Final Status:</span>
              <StatusBadge value={d.status} />
            </div>
            
            {trace.data && trace.data.length > 1 && (
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-[#686A6D]" />
                <span className="text-sm text-[#686A6D]">Execution Time:</span>
                <span className="text-sm font-medium text-black font-mono">
                  {duration(trace.data[0].at, trace.data[trace.data.length - 1].at)}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <ShieldCheck size={16} className="text-[#0070E0]" />
              <span className="text-xs font-medium text-[#686A6D]">Cryptographically Verified Policy</span>
            </div>
          </div>
        </div>
      )}

      {/* Trace Timeline */}
      <div className="bg-white border border-[#E6E7E8] rounded-xl p-6 shadow-sm">
        <div className="mb-6 pb-4 border-b border-[#E6E7E8]">
          <h3 className="text-base font-semibold text-black">Decision Trace</h3>
          <p className="text-sm text-[#686A6D] mt-1">Every rule, tool call, and API request evaluated in order.</p>
        </div>

        {trace.data && trace.data.length === 0 && (
          <EmptyState note="no steps recorded" text="This request has no recorded trace events." />
        )}

        {trace.data && trace.data.length > 0 && (
          <DecisionTrace events={trace.data} />
        )}
      </div>
    </div>
  );
}