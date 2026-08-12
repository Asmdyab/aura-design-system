import { createRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Route as dashboardRoute } from "../dashboard";
import { adminApi, type AdminStats } from "@/lib/admin-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, CreditCard, Banknote, CalendarPlus } from "lucide-react";

export const Route = createRoute({
  getParentRoute: () => dashboardRoute,
  path: "/",
  component: DashboardHomePage,
});

const statusLabels: Record<string, string> = {
  Reserved: "محجوز",
  PayLater: "دفع لاحقاً",
  PaymentPendingReview: "قيد مراجعة الدفع",
  Active: "نشط",
  Cancelled: "ملغي",
};

const statusColors: Record<string, string> = {
  Reserved: "bg-amber-100 text-amber-800",
  PayLater: "bg-gray-100 text-gray-700",
  PaymentPendingReview: "bg-blue-100 text-blue-800",
  Active: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-700",
};

function DashboardHomePage() {
  const { data: stats, isLoading } = useQuery<AdminStats>({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getStats,
    refetchInterval: 30_000,
  });

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  const cards = [
    {
      title: "إجمالي المستخدمين",
      value: stats.totalUsers,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "المستخدمون النشطون",
      value: stats.active,
      icon: UserCheck,
      color: "text-green-600",
      bg: "bg-green-100",
    },
    {
      title: "مدفوعات بانتظار المراجعة",
      value: stats.pendingPayments,
      icon: CreditCard,
      color: "text-amber-600",
      bg: "bg-amber-100",
    },
    {
      title: "إيرادات هذا الشهر",
      value: `${stats.revenueThisMonth.toLocaleString("ar")} ج.م`,
      icon: Banknote,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${card.bg}`}>
                  <Icon className={`h-6 w-6 ${card.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm text-muted-foreground">{card.title}</p>
                  <p className="text-2xl font-bold">{card.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Secondary row */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <CalendarPlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">تسجيلات جديدة هذا الشهر</p>
              <p className="text-2xl font-bold">{stats.newThisMonth}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">محجوز / بانتظار الدفع</p>
              <p className="text-2xl font-bold">{stats.reserved}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent reservations */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">أحدث التسجيلات</CardTitle>
          <Link to="/dashboard/users" className="text-sm text-primary hover:underline">
            عرض الكل ←
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="pb-3 pr-4 text-right font-medium">الاسم</th>
                  <th className="pb-3 px-3 text-right font-medium">البرنامج</th>
                  <th className="pb-3 px-3 text-right font-medium">الحالة</th>
                  <th className="pb-3 pl-4 text-right font-medium">التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentReservations.map((r) => (
                  <tr key={r.id} className="border-b last:border-b-0 hover:bg-muted/50">
                    <td className="py-3 pr-4 font-medium">{r.fullName}</td>
                    <td className="py-3 px-3">{r.programName ?? "—"}</td>
                    <td className="py-3 px-3">
                      <Badge className={`${statusColors[r.status]} hover:${statusColors[r.status]}`}>
                        {statusLabels[r.status] ?? r.status}
                      </Badge>
                    </td>
                    <td className="py-3 pl-4 text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("ar")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
