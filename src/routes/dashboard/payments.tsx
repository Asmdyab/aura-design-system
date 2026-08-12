import { createRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft, Loader2, Check, X, ImageIcon } from "lucide-react";
import { Route as dashboardRoute } from "../dashboard";
import { adminApi } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/payments",
  component: PaymentsPage,
});

const methodLabels: Record<string, string> = {
  VodafoneCash: "فودافون كاش",
  Instapay: "إنستاباي",
};

function PaymentsPage() {
  const [filter, setFilter] = useState<string>("PendingReview");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payment-proofs", { filter, page, pageSize }],
    queryFn: () => adminApi.getPaymentProofs({ status: filter || undefined, page, pageSize }),
    placeholderData: (prev) => prev,
  });

  const queryClient = useQueryClient();

  const approveMutation = useMutation({
    mutationFn: (id: string) => adminApi.approvePaymentProof(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("تمت الموافقة على الدفع");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حدث خطأ"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => adminApi.rejectPaymentProof(id, "رفض بواسطة الأدمن"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-payment-proofs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      toast.success("تم رفض الدفع");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حدث خطأ"),
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)), [data?.total, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">مراجعة المدفوعات</h2>
        <div className="flex gap-2">
          {[
            { key: "PendingReview", label: "بانتظار المراجعة" },
            { key: "Approved", label: "مقبولة" },
            { key: "Rejected", label: "مرفوضة" },
            { key: "", label: "الكل" },
          ].map((f) => (
            <Button
              key={f.key || "all"}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => { setFilter(f.key); setPage(1); }}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {isLoading && (
          <Card><CardContent className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></CardContent></Card>
        )}

        {!isLoading && data?.items.length === 0 && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد مدفوعات</CardContent></Card>
        )}

        {data?.items.map((p) => (
          <Card key={p.id} className={p.status === "PendingReview" ? "border-blue-300" : ""}>
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              {/* Proof image */}
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                {p.proofUrl ? (
                  <a href={p.proofUrl} target="_blank" rel="noreferrer">
                    <img src={p.proofUrl} alt="إثبات الدفع" className="h-20 w-20 object-cover" />
                  </a>
                ) : (
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                )}
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{p.userName}</span>
                  <Badge variant="secondary" className={p.status === "PendingReview" ? "bg-blue-100 text-blue-800" : p.status === "Approved" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-700"}>
                    {p.status === "PendingReview" ? "بانتظار المراجعة" : p.status === "Approved" ? "مقبولة" : "مرفوضة"}
                  </Badge>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>{methodLabels[p.method] ?? p.method}</span>
                  <span>{p.amount != null ? `${p.amount.toLocaleString("ar")} ج.م` : "بدون مبلغ"}</span>
                  {p.txnRef && <span className="font-mono text-xs" dir="ltr">مرجع: {p.txnRef}</span>}
                  <span className="font-mono text-xs" dir="ltr">{p.reservationRef}</span>
                  <span>واتساب: <span dir="ltr">{p.userPhone}</span></span>
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {new Date(p.createdAt).toLocaleString("ar")}
                </div>
              </div>

              {/* Actions */}
              {p.status === "PendingReview" && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate(p.id)}
                  >
                    <Check className="ml-1 h-4 w-4" />
                    موافقة
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={rejectMutation.isPending}
                    onClick={() => rejectMutation.mutate(p.id)}
                  >
                    <X className="ml-1 h-4 w-4" />
                    رفض
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            صفحة {page} من {totalPages}
          </span>
          <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}