import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Sparkles, 
  Building2, 
  Users, 
  Wrench, 
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  KeyRound
} from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24">
      {/* Glow Effects Background */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none -z-10" />
      <div className="absolute top-1/3 left-1/4 w-[350px] h-[250px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none -z-10" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-6">
          {/* Tag / Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-xs font-semibold text-violet-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span>Next-Generation Campus Residence Platform</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.15]">
            Smart Campus Living & <br className="hidden sm:inline" />
            <span className="gradient-text">Hostel Manager</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Automate room allocations, gate passes, maintenance requests, and student security logs with a centralized, high-performance platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link href="/hostels" className={buttonVariants({ variant: "glow", size: "lg", className: "w-full sm:w-auto gap-2" })}>
              Launch Hostel Dashboard
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="/allocations" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto" })}>
              View Allocations
            </Link>
          </div>

          {/* Quick Value Props */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Real-time Occupancy Tracking</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Digital Gate Pass Workflow</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Smarter Maintenance Dispatch</span>
            </div>
          </div>
        </div>

        {/* Live UI Dashboard Preview Card */}
        <div className="mt-14 max-w-5xl mx-auto">
          <Card className="glass-card border-slate-700/60 p-2 sm:p-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 px-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-red-500/80" />
                <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <div className="h-3 w-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs text-slate-400 font-mono">hostelos.internal/overview</span>
              </div>
              <Badge variant="accent" className="font-mono text-[10px]">SYSTEM ONLINE</Badge>
            </div>

            <CardContent className="p-2 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Stat 1 */}
              <Link href="/hostels" className="block group">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-violet-500/50 transition-all">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium group-hover:text-white transition-colors">Total Bed Occupancy</span>
                    <Building2 className="h-4 w-4 text-violet-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">94.2%</span>
                    <span className="text-xs text-emerald-400 flex items-center font-medium">
                      <TrendingUp className="h-3 w-3 mr-0.5" /> +3.1%
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">1,248 / 1,325 Beds Filled</p>
                </div>
              </Link>

              {/* Stat 2 */}
              <Link href="/allocations" className="block group">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-blue-500/50 transition-all">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium group-hover:text-white transition-colors">Active Allocations</span>
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">1,248</span>
                    <span className="text-xs text-slate-400 font-medium">across 4 blocks</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">100% Identity Verified</p>
                </div>
              </Link>

              {/* Stat 3 */}
              <Link href="/leave" className="block group">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-indigo-500/50 transition-all">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium group-hover:text-white transition-colors">Active Gate Passes</span>
                    <KeyRound className="h-4 w-4 text-indigo-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">42</span>
                    <span className="text-xs text-indigo-400 font-medium">Out of Campus</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">0 Overdue Returns</p>
                </div>
              </Link>

              {/* Stat 4 */}
              <Link href="/issues" className="block group">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 hover:border-amber-500/50 transition-all">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-medium group-hover:text-white transition-colors">Open Maintenance</span>
                    <Wrench className="h-4 w-4 text-amber-400" />
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-white">12</span>
                    <span className="text-xs text-amber-400 font-medium">Active Tickets</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Click to view & report issues</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
