import Link from "next/link";
import { Building2 } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 pt-12 pb-8 text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-white">
                Hostel <span className="gradient-text">Manager</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              The modern, high-reliability campus residence management platform for colleges, universities, and student living hubs.
            </p>
          </div>

          {/* Core Modules */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              System Modules
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li><Link href="/hostels" className="hover:text-white transition-colors">Hostel Blocks</Link></li>
              <li><Link href="/allocations" className="hover:text-white transition-colors">Room Allocation</Link></li>
              <li><Link href="/leave" className="hover:text-white transition-colors">Gate Pass Engine</Link></li>
              <li><Link href="/issues" className="hover:text-white transition-colors">Maintenance Dispatch</Link></li>
              <li><Link href="/analytics" className="hover:text-white transition-colors">Occupancy Analytics</Link></li>
            </ul>
          </div>

          {/* Stack & Architecture */}
          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Technology Stack
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li className="text-slate-300">Next.js 16+ App Router</li>
              <li className="text-slate-300">TypeScript & Tailwind CSS</li>
              <li className="text-slate-300">Supabase SSR Data Layer</li>
              <li className="text-slate-300">Role-Based Access Control</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Hostel Manager. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with precision for campus management</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
