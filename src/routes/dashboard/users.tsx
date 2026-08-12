import { createRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { Route as dashboardRoute } from "../dashboard";
import {
  adminApi,
  type ReservationStatus,
  type ReservationListItem,
} from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/users",
  component: UsersPage,
});

const statusLabels: Record<ReservationStatus, string> = {
  Reserved: "محجوز",
  PayLater: "دفع لاحقاً",
  PaymentPendingReview: "قيد مراجعة الدفع",
  Active: "نشط",
  Cancelled: "ملغي",
};

const statusColors: Record<ReservationStatus, string> = {
  Reserved: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  PayLater: "bg-gray-100 text-gray-700 hover:bg-gray-100",
  PaymentPendingReview: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  Active: "bg-green-100 text-green-800 hover:bg-green-100",
  Cancelled: "bg-red-100 text-red-700 hover:bg-red-100",
};

const createSchema = z.object({
  fullName: z.string().min(1, "الاسم مطلوب"),
  whatsappPhone: z.string().min(1, "رقم الواتساب مطلوب"),
  programId: z.union([z.number(), z.custom<number | null>()]),
  preferredSchedule: z.string().optional(),
  notes: z.string().optional(),
  payNow: z.boolean(),
});

type CreateFormData = z.infer<typeof createSchema>;

function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => setPage(1), [debouncedSearch, statusFilter]);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservations", { debouncedSearch, statusFilter, page, pageSize }],
    queryFn: () =>
      adminApi.getReservations({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
      }),
    placeholderData: (prev) => prev,
  });

  const { data: programs } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: adminApi.getPrograms,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReservationStatus }) =>
      adminApi.updateReservationStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("تم تحديث حالة المستخدم");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حدث خطأ"),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateFormData) =>
      adminApi.createReservation({
        fullName: data.fullName,
        whatsappPhone: data.whatsappPhone,
        programId: data.programId ?? null,
        preferredSchedule: data.preferredSchedule || undefined,
        notes: data.notes || undefined,
        payNow: data.payNow,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success("تم تسجيل مشترك جديد");
      setOpen(false);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حدث خطأ"),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateFormData>({
    resolver: zodResolver(createSchema),
    defaultValues: { payNow: false, programId: null },
  });

  const payNow = watch("payNow");
  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.total ?? 0) / pageSize)), [data?.total, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">المستخدمون ({data?.total ?? "…"})</h2>
        <Button
          onClick={() => {
            reset({ fullName: "", whatsappPhone: "", programId: null, preferredSchedule: "", notes: "", payNow: false });
            setOpen(true);
          }}
        >
          <Plus className="ml-2 h-4 w-4" />
          تسجيل مشترك جديد
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pr-9 text-right"
                placeholder="بحث بالاسم أو رقم الواتساب أو المرجع…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v)}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder="كل الحالات" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                {Object.entries(statusLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-190 text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="py-3 pr-4 text-right font-medium">الاسم</th>
                  <th className="px-3 py-3 text-right font-medium">الواتساب</th>
                  <th className="px-3 py-3 text-right font-medium">البرنامج</th>
                  <th className="px-3 py-3 text-right font-medium">المرجع</th>
                  <th className="px-3 py-3 text-right font-medium">التسجيل</th>
                  <th className="px-3 py-3 text-right font-medium">الحالة</th>
                  <th className="py-3 pl-4 text-right font-medium">تغيير الحالة</th>
                </tr>
              </thead>
              <tbody>
                {isLoading && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                    </td>
                  </tr>
                )}
                {!isLoading && data?.items.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      لا توجد نتائج
                    </td>
                  </tr>
                )}
                {data?.items.map((r) => {
                  const hasPendingPayment = r.status === "PaymentPendingReview";
                  return (
                    <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/50">
                      <td className="py-3 pr-4 font-medium">
                        {r.fullName}
                        {hasPendingPayment && (
                          <Badge className="mr-2 bg-blue-100 text-blue-800 hover:bg-blue-100">دفع بانتظار مراجعة</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right" dir="ltr">{r.whatsappPhone}</td>
                      <td className="px-3 py-3">
                        <div className="text-sm">{r.programName ?? "—"}</div>
                        {r.programPrice != null && (
                          <div className="text-xs text-muted-foreground">{r.programPrice.toLocaleString("ar")} ج.م</div>
                        )}
                      </td>
                      <td className="px-3 py-3 text-right font-mono text-xs" dir="ltr">{r.referenceNumber}</td>
                      <td className="px-3 py-3 text-muted-foreground">
                        {new Date(r.createdAt).toLocaleDateString("ar")}
                      </td>
                      <td className="px-3 py-3">
                        <Badge className={statusColors[r.status]}>{statusLabels[r.status]}</Badge>
                      </td>
                      <td className="py-3 pl-4">
                        <select
                          className="h-8 rounded-md border border-input bg-background px-2 text-sm cursor-pointer"
                          value={r.status}
                          disabled={statusMutation.isPending && statusMutation.variables?.id === r.id}
                          onChange={(e) =>
                            statusMutation.mutate({ id: r.id, status: e.target.value as ReservationStatus })
                          }
                        >
                          {Object.entries(statusLabels).map(([key, label]) => (
                            <option key={key} value={key}>{label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t px-4 py-3 text-sm">
            <p className="text-muted-foreground">
              صفحة {page} من {totalPages} — {data?.total ?? 0} إجمالي
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Manual enrollment dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تسجيل مشترك جديد</DialogTitle>
            <DialogDescription>أدخل بيانات المشترك الجديد لإجراء التسجيل أو الاشتراك.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((data) => createMutation.mutate(data))}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>الاسم الكامل</Label>
              <Input {...register("fullName")} className="text-right" placeholder="مثال: أحمد محمد" />
              {errors.fullName && <p className="text-sm text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>رقم الواتساب</Label>
              <Input {...register("whatsappPhone")} className="text-right" placeholder="20xxxxxxxxx" dir="ltr" />
              {errors.whatsappPhone && <p className="text-sm text-destructive">{errors.whatsappPhone.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>البرنامج / الباقة</Label>
              <Select
                value={String(watch("programId") ?? "")}
                onValueChange={(v) => setValue("programId", v ? Number(v) : null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر البرنامج" />
                </SelectTrigger>
                <SelectContent>
                  {(programs ?? [])
                    .filter((p) => p.isActive)
                    .map((p) => (
                      <SelectItem key={p.id} value={String(p.id)}>
                        {p.name} — {p.price.toLocaleString("ar")} ج.م
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الجدول المفضل (اختياري)</Label>
              <Input {...register("preferredSchedule")} className="text-right" placeholder="مثال: السبت والأربعاء مساءً" />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Textarea {...register("notes")} className="min-h-20 text-right" />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="payNow"
                checked={payNow}
                onCheckedChange={(v) => setValue("payNow", v === true)}
              />
              <Label htmlFor="payNow" className="cursor-pointer">يدفع الآن (سيكون بانتظار مراجعة الدفع)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                تسجيل
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}