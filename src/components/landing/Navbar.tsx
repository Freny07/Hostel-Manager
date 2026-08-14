"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Building2, LogOut, User as UserIcon, Bed, Wrench, BarChart3 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import type { User } from "@supabase/supabase-js";

export function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Check active session
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    const supabase = createBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Hostel<span className="gradient-text">OS</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
          <Link href="#features" className="hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#stats" className="hover:text-white transition-colors">
            Impact
          </Link>
          <Link href="#overview" className="hover:text-white transition-colors">
            Overview
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <Badge variant="success" className="hidden sm:flex items-center gap-1 py-1 px-3">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Operations
          </Badge>

          {!loading && user ? (
            <div className="flex items-center gap-3">
              <Link
                href="/hostels"
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 border-violet-500/30 text-violet-300 hover:text-white" })}
              >
                <Building2 className="h-3.5 w-3.5 text-violet-400" />
                Hostels
              </Link>
              <Link
                href="/allocations"
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 border-indigo-500/30 text-indigo-300 hover:text-white" })}
              >
                <Bed className="h-3.5 w-3.5 text-indigo-400" />
                Allocations
              </Link>
              <Link
                href="/issues"
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 border-amber-500/30 text-amber-300 hover:text-white" })}
              >
                <Wrench className="h-3.5 w-3.5 text-amber-400" />
                Issues
              </Link>
              <Link
                href="/analytics"
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 border-indigo-500/30 text-indigo-300 hover:text-white" })}
              >
                <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
                Analytics
              </Link>
              <NotificationBell userId={user.id} />
              <Link
                href="/profile"
                className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5" })}
              >
                <UserIcon className="h-3.5 w-3.5 text-violet-400" />
                My Profile
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="gap-1.5 text-slate-400 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className={buttonVariants({ variant: "outline", size: "sm" })}>
                Sign In
              </Link>
              <Link href="/signup" className={buttonVariants({ size: "sm" })}>
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
