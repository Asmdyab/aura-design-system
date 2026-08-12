import { createRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Loader2, Pencil, Power, Trash2 } from "lucide-react";
import { Route as dashboardRoute } from "../dashboard";
import { adminApi, type ProgramListItem } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/programs",
  component: ProgramsPage,
});

const schema = z.object({
  name: z.string().min(1, "الاسم مطلوب"),
  category: z.string().min(1, "الفئة مطلوبة"),
  price: z.coerce.number().min(0, "السعر يجب أن يكون صفر أو أكبر"),
  period: z.string().min(1, "الفترة مطلوبة"),
  features: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

function ProgramsPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProgramListItem | null>(null);
  const [deleting, setDeleting] = useState<ProgramListItem | null>(null);

  const { data: programs, isLoading } = useQuery({
    queryKey: ["admin-programs"],
    queryFn: adminApi.getPrograms,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const saveMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        name: data.name,
        category: data.category,
        price: data.price,
        period: data.period,
        features: (data.features ?? "")
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        description: data.description || null,
        notes: data.notes || null,
      };
      return editing ? adminApi.updateProgram(editing.id, payload) : adminApi.createProgram(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      toast.success(editing ? "تم تحديث البرنامج" : "تم إنشاء البرنامج");
      setOpen(false);
      setEditing(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حدث خطأ"),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: number) => adminApi.toggleProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      toast.success("تم تحديث حالة البرنامج");
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "حدث خطأ"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteProgram(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-programs"] });
      toast.success("تم حذف البرنامج");
      setDeleting(null);
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "لا يمكن حذف البرنامج"),
  });

  const openCreate = () => {
    setEditing(null);
    reset({ name: "", category: "", price: 0, period: "", features: "", description: "", notes: "" });
    setOpen(true);
  };

  const openEdit = (p: ProgramListItem) => {
    setEditing(p);
    reset({
      name: p.name,
      category: p.category,
      price: p.price,
      period: p.period,
      features: p.features.join("\n"),
      description: p.description ?? "",
      notes: p.notes ?? "",
    });
    setOpen(true);
  };

  const categories = useQuery({
    queryKey: ["admin-program-categories"],
    queryFn: async () => {
      const all = await adminApi.getPrograms();
      return Array.from(new Set(all.map((p) => p.category)));
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-semibold">البرامج والباقات ({programs?.length ?? "…"})</h2>
        <Button onClick={openCreate}>
          <Plus className="ml-2 h-4 w-4" />
          برنامج جديد
        </Button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}><CardContent className="py-8" /></Card>
          ))}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {programs?.map((p) => (
          <Card key={p.id} className={!p.isActive ? "opacity-60" : ""}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-base">{p.name}</CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">{p.category}</p>
              </div>
              <Badge variant={p.isActive ? "default" : "secondary"}>
                {p.isActive ? "نشط" : "موقوف"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold">{p.price.toLocaleString("ar")} <span className="text-sm font-medium text-muted-foreground">ج.م</span></span>
                <span className="text-sm text-muted-foreground">{p.period}</span>
              </div>

              {p.features.length > 0 && (
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {p.features.slice(0, 4).map((f, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                  {p.features.length > 4 && (
                    <li className="text-xs text-muted-foreground">+{p.features.length - 4} أخرى</li>
                  )}
                </ul>
              )}

              {p.notes && <p className="text-xs text-muted-foreground">ملاحظة: {p.notes}</p>}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                  <Pencil className="ml-1 h-3.5 w-3.5" />
                  تعديل
                </Button>
                <Button
                  variant={p.isActive ? "secondary" : "default"}
                  size="sm"
                  onClick={() => toggleMutation.mutate(p.id)}
                >
                  <Power className="ml-1 h-3.5 w-3.5" />
                  {p.isActive ? "إيقاف" : "تفعيل"}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  title="حذف"
                  onClick={() => setDeleting(p)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "تعديل البرنامج" : "برنامج جديد"}</DialogTitle>
            <DialogDescription>
              {editing ? "عدّل تفاصيل البرنامج أو الباقة." : "أدخل تفاصيل البرنامج أو الباقة الجديدة."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>اسم البرنامج</Label>
                <Input {...register("name")} className="text-right" />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>الفئة</Label>
                <Input {...register("category")} className="text-right" list="program-categories" />
                <datalist id="program-categories">
                  {(categories.data ?? []).map((c) => <option key={c} value={c} />)}
                </datalist>
                {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>السعر (ج.م)</Label>
                <Input type="number" step="0.01" min="0" {...register("price")} className="text-right" />
                {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-2">
                <Label>الفترة</Label>
                <Input {...register("period")} className="text-right" placeholder="مثال: شهرياً" />
                {errors.period && <p className="text-sm text-destructive">{errors.period.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>المميزات (كل ميزة في سطر)</Label>
              <Textarea {...register("features")} className="min-h-24 text-right" placeholder={"مثال:\nحصتان أسبوعياً\nمتابعة مستمرة"} />
            </div>

            <div className="space-y-2">
              <Label>الوصف (اختياري)</Label>
              <Textarea {...register("description")} className="min-h-16 text-right" />
            </div>

            <div className="space-y-2">
              <Label>ملاحظات (اختياري)</Label>
              <Input {...register("notes")} className="text-right" />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {editing ? "حفظ التعديلات" : "إنشاء"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البرنامج؟</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف «{deleting?.name}»؟ إذا كان لديه مشتركين فقد لا يتم الحذف. يُفضَّل الإيقاف بدلاً من الحذف.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleting && deleteMutation.mutate(deleting.id)}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}