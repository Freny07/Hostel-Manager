"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import {
  Building2,
  LogOut,
  User as UserIcon,
  Bed,
  Wrench,
  BarChart3,
  Calendar,
  Megaphone,
  ShieldCheck,
  Menu,
  X,
  ChevronDown,
  Shield,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("Student");
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    const resolveRole = async (u: User | null) => {
      if (!u) {
        setUserRole("Student");
        return;
      }

      // Check explicit email rules
      const email = u.email?.toLowerCase() || "";
      if (email === "frenypatel2007@gmail.com") {
        setUserRole("Admin");
        return;
      }
      if (email === "frenydpatel@gamil.com" || email === "frenydpatel@gmail.com") {
        setUserRole("Warden");
        return;
      }

      // Query database profile for assigned role
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: profile } = await (supabase as any)
          .from("profiles")
          .select("*, roles(name)")
          .eq("id", u.id)
          .maybeSingle();

        if (profile?.roles?.name) {
          const rName = String(profile.roles.name);
          setUserRole(rName.charAt(0).toUpperCase() + rName.slice(1));
        } else {
          setUserRole(email.endsWith("@iiitl.ac.in") ? "Student" : "Student");
        }
      } catch {
        setUserRole("Student");
      }
    };

    supabase.auth.getUser().then(({ data: { user } }) => {
      clearTimeout(timer);
      setUser(user);
      resolveRole(user);
      setLoading(false);
    }).catch(() => {
      clearTimeout(timer);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        clearTimeout(timer);
        const u = session?.user ?? null;
        setUser(u);
        resolveRole(u);
        setLoading(false);
      }
    );

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setUserRole("Student");
    router.push("/");
    router.refresh();
  };

  const navItems = [
    { href: "/hostels", label: "Hostels", icon: Building2, color: "text-violet-400" },
    { href: "/allocations", label: "Allocations", icon: Bed, color: "text-indigo-400" },
    { href: "/issues", label: "Issues", icon: Wrench, color: "text-amber-400" },
    { href: "/leave", label: "Leave Pass", icon: Calendar, color: "text-emerald-400" },
    { href: "/announcements", label: "Notices", icon: Megaphone, color: "text-cyan-400" },
    { href: "/analytics", label: "Analytics", icon: BarChart3, color: "text-purple-400" },
    { href: "/admin/audit-logs", label: "Audit Logs", icon: ShieldCheck, color: "text-rose-400" },
  ];

  const getRoleBadgeVariant = (roleStr: string) => {
    switch (roleStr.toLowerCase()) {
      case "admin":
        return "bg-violet-950/80 text-violet-300 border-violet-700/60";
      case "warden":
        return "bg-indigo-950/80 text-indigo-300 border-indigo-700/60";
      default:
        return "bg-emerald-950/80 text-emerald-300 border-emerald-700/60";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-indigo-600 to-cyan-500 p-0.5 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950/40 backdrop-blur-xs">
                <Building2 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1">
                Hostel<span className="gradient-text">Manager</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 pl-4 border-l border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? "bg-slate-800/90 text-white shadow-xs border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Action Controls & User Role Badge */}
        <div className="hidden sm:flex items-center gap-3">
          
          {/* Active User Role Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeVariant(userRole)}`}>
            <Shield className="h-3.5 w-3.5" />
            <span>Role: {userRole}</span>
          </div>

          {/* Notification Bell */}
          <NotificationBell userId={user?.id || "demo-user"} />

          {/* User Menu or Auth Actions */}
          {!loading && user ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800/80 transition-colors text-xs font-medium text-slate-200"
              >
                <div className="h-6 w-6 rounded-full bg-gradient-to-tr from-violet-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {user.email?.[0]?.toUpperCase() || "U"}
                </div>
                <span className="max-w-[120px] truncate">{user.email?.split("@")[0]}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl p-1.5 shadow-2xl z-50 text-xs"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-3 py-2 border-b border-slate-800 mb-1">
                    <p className="font-semibold text-white truncate">{user.email}</p>
                    <p className="text-[10px] text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      Role: {userRole}
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    <UserIcon className="h-4 w-4 text-violet-400" />
                    My Profile
                  </Link>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign In
              </Link>
              <Link href="/signup" className={buttonVariants({ variant: "glow", size: "sm" })}>
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Drawer Menu Toggle */}
        <div className="flex items-center gap-2 sm:hidden">
          <NotificationBell userId={user?.id || "demo-user"} />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-3">
          
          {/* Mobile Active Role Display */}
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-violet-400" />
              Active System Role:
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeVariant(userRole)}`}>
              {userRole}
            </span>
          </div>

          {/* Navigation Links */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium border ${
                    isActive
                      ? "bg-slate-800 text-white border-slate-700"
                      : "bg-slate-900/60 text-slate-300 border-slate-800/80"
                  }`}
                >
                  <Icon className={`h-4 w-4 ${item.color}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Auth Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            {user ? (
              <div className="flex items-center justify-between w-full">
                <Link
                  href="/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 text-xs text-slate-300"
                >
                  <UserIcon className="h-4 w-4 text-violet-400" />
                  Profile
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-rose-400">
                  <LogOut className="h-4 w-4 mr-1" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 w-full">
                <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm", className: "w-full justify-center" })}>
                  Sign In
                </Link>
                <Link href="/signup" className={buttonVariants({ size: "sm", className: "w-full justify-center" })}>
                  Sign Up
                </Link>
              </div>
            )}
          </div>

        </div>
      )}
    </header>
  );
}
