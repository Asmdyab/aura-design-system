import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoute, Link, Outlet, useNavigate, useLocation } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  LogOut,
  Menu,
  X,
  CheckCheck,
} from "lucide-react";
import { Route as rootRoute } from "./__root";
import { isAuthenticated, getAdminUser, logout, adminApi } from "@/lib/admin-api";
import { useAdminNotifications, type AdminPushNotification } from "@/hooks/use-admin-notifications";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardLayout,
});

const navItems = [
  { path: "/dashboard", label: "نظرة عامة", icon: LayoutDashboard, exact: true },
  { path: "/dashboard/users", label: "المستخدمون", icon: Users },
  { path: "/dashboard/payments", label: "المدفوعات", icon: CreditCard },
  { path: "/dashboard/programs", label: "البرامج", icon: BookOpen },
];

const navActiveClass = "bg-primary text-primary-foreground";
const navInactiveClass = "text-muted-foreground hover:bg-accent hover:text-accent-foreground";

function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const user = getAdminUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement>(null);

  const pathname = location.pathname;
  const isLoggedIn = isAuthenticated();
  const isLoginPath = pathname === "/dashboard/login";

  // Auth guard — redirect any non-login dashboard page to the login form.
  useEffect(() => {
    if (!isLoggedIn && !isLoginPath) {
      navigate({ to: "/dashboard/login", replace: true });
    }
  }, [navigate, isLoggedIn, isLoginPath]);

  // Unread count — polled as fallback in case SignalR drops.
  const { data: unreadData } = useQuery({
    queryKey: ["admin-notifications-unread"],
    queryFn: () => adminApi.getNotifications({ unreadOnly: true, pageSize: 1 }),
    refetchInterval: 60_000,
    enabled: isAuthenticated(),
    staleTime: 30_000,
  });

  const { data: notifList } = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: () => adminApi.getNotifications({ pageSize: 20 }),
    enabled: isAuthenticated() && notifPanelOpen,
    staleTime: 10_000,
  });

  const unreadCount = unreadData?.total ?? 0;

  const handlePush = useCallback(
    (n: AdminPushNotification) => {
      // Show toast
      toast(n.message, {
        description: new Date(n.createdAt).toLocaleString("ar"),
        icon: <Bell className="h-4 w-4" />,
        duration: 6000,
      });
      // Invalidate notification queries so badge + list update
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["admin-notifications-unread"] });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["admin-payment-proofs"] });
    },
    [queryClient],
  );

  useAdminNotifications(handlePush, isAuthenticated());

  // Close notification panel on outside click
  useEffect(() => {
    if (!notifPanelOpen) return;
    const handler = (e: MouseEvent) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(e.target as Node)) {
        setNotifPanelOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifPanelOpen]);

  const activeItem = useMemo(() => {
    const exact = navItems.find((n) => n.exact && pathname === n.path);
    if (exact) return exact;
    return navItems.find((n) => pathname.startsWith(n.path)) ?? navItems[0];
  }, [pathname]);

  // Not authenticated: render only the login child (the redirect effect above
  // moves any other /dashboard/* page to the login form).
  if (!isLoggedIn) {
    if (!isLoginPath) return null;
    return (
      <div dir="rtl" className="min-h-screen bg-muted/40">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30" dir="rtl">
      {/* Sidebar – mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-64 flex-col border-l bg-sidebar text-sidebar-foreground transition-transform duration-200 md:translate-x-0",
          sidebarOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary">
            <span>أكاديمية القرآن</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                activeProps={{ className: navActiveClass }}
                inactiveProps={{ className: navInactiveClass }}
                activeOptions={item.exact ? { exact: true } : undefined}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors"
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t p-3">
          <div className="mb-2 flex items-center gap-2 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
              {user?.fullName?.charAt(0) ?? "أ"}
            </div>
            <div className="flex-1 truncate">
              <p className="truncate text-sm font-medium">{user?.fullName}</p>
              <p className="truncate text-xs text-muted-foreground">@{user?.userName}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={logout}>
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col md:mr-64">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex-1 text-lg font-semibold">
            {activeItem?.label}
          </div>

          {/* Notification bell */}
          <div className="relative" ref={notifPanelRef}>
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={() => setNotifPanelOpen((v) => !v)}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -left-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[11px] font-bold text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {notifPanelOpen && (
              <div className="absolute left-0 top-12 w-96 max-w-[calc(100vw-2rem)] rounded-xl border bg-background shadow-xl">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <h3 className="font-semibold">الإشعارات</h3>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        adminApi.markAllNotificationsRead().then(() => {
                          queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
                          queryClient.invalidateQueries({ queryKey: ["admin-notifications-unread"] });
                        });
                      }}
                    >
                      <CheckCheck className="ml-1 h-4 w-4" />
                      قراءة الكل
                    </Button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifList?.items.length === 0 && (
                    <p className="py-8 text-center text-sm text-muted-foreground">لا توجد إشعارات بعد</p>
                  )}
                  {notifList?.items.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "border-b px-4 py-3 last:border-b-0",
                        !n.isRead && "bg-primary/5",
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm leading-relaxed">{n.message}</p>
                        {!n.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleString("ar")}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
