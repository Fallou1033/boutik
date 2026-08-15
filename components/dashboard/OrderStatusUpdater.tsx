"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const TRANSITIONS: Record<string, string[]> = {
  pending:          ["awaiting_payment", "cancelled"],
  awaiting_payment: ["paid", "cancelled"],
  paid:             ["preparing", "refunded"],
  preparing:        ["shipped"],
  shipped:          ["delivered"],
  delivered:        ["refunded"],
};

const STATUS_LABELS: Record<string, { label: string; emoji: string; class: string }> = {
  awaiting_payment: { label: "Att. paiement", emoji: "⏳", class: "bg-amber-500" },
  paid:             { label: "Marquer payé",  emoji: "✅", class: "bg-brand-500" },
  preparing:        { label: "En préparation",emoji: "📦", class: "bg-violet-500" },
  shipped:          { label: "Expédié",       emoji: "🚚", class: "bg-blue-500" },
  delivered:        { label: "Livré",         emoji: "🎉", class: "bg-green-600" },
  cancelled:        { label: "Annuler",       emoji: "❌", class: "bg-red-500" },
  refunded:         { label: "Remboursé",     emoji: "↩️", class: "bg-gray-500" },
};

interface Props {
  orderId: string;
  currentStatus: string;
}

export default function OrderStatusUpdater({ orderId, currentStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const nextStatuses = TRANSITIONS[currentStatus] ?? [];
  if (nextStatuses.length === 0) return null;

  const handleUpdate = async (newStatus: string) => {
    setLoading(newStatus);
    const supabase = createClient();

    await supabase
      .from("orders")
      .update({ order_status: newStatus } as never)
      .eq("id", orderId);

    setLoading(null);
    router.refresh();
  };

  return (
    <div className="card card-body">
      <p className="text-sm font-medium text-text-muted mb-3">Mettre à jour le statut :</p>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((status) => {
          const cfg = STATUS_LABELS[status];
          if (!cfg) return null;
          return (
            <button
              key={status}
              onClick={() => handleUpdate(status)}
              disabled={loading !== null}
              className={cn(
                "btn-sm text-white rounded-xl gap-2 flex items-center px-4 py-2",
                cfg.class,
                "hover:opacity-90 disabled:opacity-60 transition-all"
              )}
            >
              {loading === status ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <span>{cfg.emoji}</span>
              )}
              {cfg.label}
              <ChevronRight className="w-3 h-3 opacity-60" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
