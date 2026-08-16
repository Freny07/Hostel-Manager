import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { Footer } from "@/components/landing/Footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Cpu, Zap, ArrowRight, Wrench, AlertTriangle, Clock, ChevronRight } from "lucide-react";
import { getIssuesAction } from "@/app/issues/issue-actions";

export default async function Home() {
  const issuesRes = await getIssuesAction();
  const recentIssues = issuesRes.success && issuesRes.data ? issuesRes.data.slice(0, 4) : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Live Recent Maintenance Issues Dashboard Feed */}
        <section className="py-10 border-t border-slate-800/80 bg-slate-950/90">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-1">
                  <Wrench className="h-4 w-4" /> Live Dashboard Feed
                </div>
                <h2 className="text-2xl font-extrabold text-white">Recent Maintenance Issues</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Real-time ticket updates reported by residents and wardens.
                </p>
              </div>

              <Link href="/issues" className={buttonVariants({ variant: "outline", size: "sm", className: "gap-1.5 shrink-0" })}>
                <span>View All Tickets ({issuesRes.data?.length || 0})</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentIssues.map((issue) => (
                <Link key={issue.id} href={`/issues`} className="block group">
                  <Card className="glass-card border-slate-800 p-4 hover:border-amber-500/40 transition-all h-full flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-300 capitalize">
                          {issue.category}
                        </span>
                        <Badge
                          variant={
                            issue.status === "resolved"
                              ? "success"
                              : issue.status === "investigating"
                              ? "accent"
                              : "secondary"
                          }
                          className="text-[10px] uppercase"
                        >
                          {issue.status.replace("_", " ")}
                        </Badge>
                      </div>

                      <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {issue.title}
                      </h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {issue.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-900/80 flex items-center justify-between text-[10px] text-slate-500 font-mono mt-3">
                      <span>{issue.hostel?.name || "Hostel Block"} • Rm {issue.room?.room_number || "N/A"}</span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-500" />
                        {issue.created_at ? issue.created_at.split("T")[0] : "Today"}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Stats Highlight Bar */}
        <StatsSection />

        {/* Features & Modules */}
        <FeaturesSection />

        {/* System Overview Section */}
        <section id="overview" className="py-20 relative bg-slate-950/60 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
              <Badge variant="default" className="px-3 py-1">
                <Cpu className="h-3.5 w-3.5 mr-1" /> High Reliability System
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Built for Campus Scale & Speed
              </h2>
              <p className="text-slate-400 text-base sm:text-lg">
                Hostel Manager provides instant synchronization between student mobile apps, warden control panels, and gate security terminals.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-slate-800 p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-2">
                    <Zap className="h-5 w-5 text-violet-400" />
                  </div>
                  <CardTitle className="text-lg">Real-Time Sync</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Instant updates across room availability, gate movement entries, and emergency student notifications.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass-card border-slate-800 p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg">Secure Access Control</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Verified digital IDs, QR gate verification, and end-to-end encrypted resident profile management.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass-card border-slate-800 p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                    <Cpu className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">Unified Dashboard</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Centralized hub for wardens and administrators to manage bed allocations, fees, and maintenance workflows.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Product CTA Banner */}
            <div className="mt-12 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-500/20 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">Ready to Modernize Your Campus Accommodation?</h3>
                <p className="text-slate-300 text-sm max-w-xl">
                  Create your student profile today or sign in to access room details and campus residence services.
                </p>
              </div>
              <Link href="/signup" className={buttonVariants({ variant: "glow", size: "lg", className: "whitespace-nowrap gap-2" })}>
                Get Started
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
