import { ShieldCheck, Zap, Clock, Smile } from "lucide-react";

const stats = [
  {
    icon: Zap,
    metric: "98.4%",
    label: "Allocation Efficiency",
    subtext: "Faster room assignment turnaround",
  },
  {
    icon: Clock,
    metric: "< 15 min",
    label: "Gate Pass Approvals",
    subtext: "Digital Warden authorization flow",
  },
  {
    icon: ShieldCheck,
    metric: "100%",
    label: "Security Audit Trail",
    subtext: "Log history for entry/exit & visitors",
  },
  {
    icon: Smile,
    metric: "4.9/5",
    label: "Student Experience",
    subtext: "Higher satisfaction on maintenance response",
  },
];

export function StatsSection() {
  return (
    <section id="stats" className="py-16 border-y border-slate-800/80 bg-slate-950/40 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div key={idx} className="flex flex-col items-center text-center p-4">
                <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-3">
                  <Icon className="h-5 w-5 text-violet-400" />
                </div>
                <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                  {stat.metric}
                </span>
                <span className="text-sm font-semibold text-slate-200 mt-1">
                  {stat.label}
                </span>
                <span className="text-xs text-slate-500 mt-0.5">
                  {stat.subtext}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
