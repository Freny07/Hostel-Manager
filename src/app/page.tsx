import { Navbar } from "@/components/landing/Navbar";
import { HeroSection } from "@/components/landing/HeroSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { StatsSection } from "@/components/landing/StatsSection";
import { Footer } from "@/components/landing/Footer";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Layers, ShieldCheck, ArrowUpRight, Cpu } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Navigation */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection />

        {/* Stats Highlight Bar */}
        <StatsSection />

        {/* Features & Modules */}
        <FeaturesSection />

        {/* System Architecture Section */}
        <section id="architecture" className="py-20 relative bg-slate-950/60 border-t border-slate-800">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
              <Badge variant="default" className="px-3 py-1">
                <Cpu className="h-3.5 w-3.5 mr-1" /> Modular Architecture
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
                Clean Engineering & Modern Stack
              </h2>
              <p className="text-slate-400 text-base sm:text-lg">
                HostelOS is built with strict TypeScript typing, modular server & client boundaries, and an expandable domain model layer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="glass-card border-slate-800 p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-2">
                    <Layers className="h-5 w-5 text-violet-400" />
                  </div>
                  <CardTitle className="text-lg">Structured App Router</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Separated page routes, layout wrappers, and isolated client UI components adhering to Next.js App Router paradigms.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass-card border-slate-800 p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                  </div>
                  <CardTitle className="text-lg">Strong Domain Types</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Pre-configured TypeScript types for Hostel Blocks, Rooms, Students, Maintenance Tickets, and Gate Passes.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="glass-card border-slate-800 p-2">
                <CardHeader>
                  <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-2">
                    <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                  </div>
                  <CardTitle className="text-lg">Zero Bloat Foundation</CardTitle>
                  <CardDescription className="text-slate-400 text-sm">
                    Production-ready baseline configured with Tailwind CSS, shadcn/ui components, ESLint, and environment variables.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {/* Architecture Banner */}
            <div className="mt-12 rounded-2xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-indigo-950/60 border border-violet-500/20 p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center md:text-left">
                <h3 className="text-2xl font-bold text-white">Ready for Phase 2 Implementation?</h3>
                <p className="text-slate-300 text-sm max-w-xl">
                  The initial project foundation is ready. Subsequent phases can safely connect authentication, database schemas, warden dashboards, and student portals.
                </p>
              </div>
              <Button variant="glow" size="lg" className="whitespace-nowrap">
                Foundation Verified
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
