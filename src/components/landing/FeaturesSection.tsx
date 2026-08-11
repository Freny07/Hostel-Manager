import { 
  Building2, 
  KeyRound, 
  Wrench, 
  CreditCard, 
  ShieldAlert, 
  BarChart3, 
  Zap 
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Building2,
    title: "Smart Bed & Room Allocation",
    description: "Automate room inventory management, track block capacity, floor maps, and student preferences with instant re-allocation.",
    badge: "Core Inventory",
    color: "text-violet-400",
    bg: "bg-violet-500/10 border-violet-500/20",
  },
  {
    icon: KeyRound,
    title: "Digital Gate Pass & Security",
    description: "Streamline out-of-campus movement with multi-level Warden approvals, digital QR verification, and real-time movement logs.",
    badge: "Security & Safety",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10 border-indigo-500/20",
  },
  {
    icon: Wrench,
    title: "Maintenance Ticket Engine",
    description: "Empower students to raise issues for plumbing, electrical, or Wi-Fi with photo attachments, urgency tagging, and staff task tracking.",
    badge: "Operations",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  {
    icon: CreditCard,
    title: "Fee & Mess Billing Ledger",
    description: "Clear tracking for hostel stay fees, caution deposits, and mess charges with automated reminders and receipt generation.",
    badge: "Finance",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  {
    icon: ShieldAlert,
    title: "Emergency & Visitor Check-In",
    description: "Instant night roll-call logging, emergency SOS notifications to wardens, and digital visitor registration desk.",
    badge: "Compliance",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  {
    icon: BarChart3,
    title: "Occupancy Analytics",
    description: "Real-time reports on bed occupancy trends, revenue collection rates, utility usage, and unresolved maintenance metrics.",
    badge: "Intelligence",
    color: "text-sky-400",
    bg: "bg-sky-500/10 border-sky-500/20",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <Badge variant="accent" className="px-3 py-1">
            <Zap className="h-3.5 w-3.5 mr-1" /> Built for Scale
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Everything Needed to Manage <br />
            <span className="gradient-text">Modern Campus Accommodation</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg">
            Designed specifically for universities, colleges, and private student housing providers seeking seamless operations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => {
            const IconComponent = feature.icon;
            return (
              <Card key={idx} className="glass-card glass-card-hover border-slate-800 flex flex-col justify-between">
                <CardHeader>
                  <div className="flex items-center justify-between mb-3">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center border ${feature.bg}`}>
                      <IconComponent className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium border-slate-800">
                      {feature.badge}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-sm text-slate-400 leading-relaxed mt-2">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-1.5 text-xs text-violet-400 font-semibold cursor-pointer hover:text-violet-300 transition-colors">
                    <span>Learn module workflow</span>
                    <span>→</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
