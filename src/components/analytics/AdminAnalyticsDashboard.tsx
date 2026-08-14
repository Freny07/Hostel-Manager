"use client";

import { useEffect, useState } from "react";
import {
  BarChart3,
  Users,
  Bed,
  Wrench,
  AlertTriangle,
  Clock,
  Building2,
  TrendingUp,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getAdminAnalyticsDataAction,
  type AnalyticsData,
} from "@/app/analytics/analytics-actions";

export function AdminAnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAdminAnalyticsDataAction();
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load operational analytics.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    getAdminAnalyticsDataAction()
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load operational analytics.");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : "Error fetching analytics.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium text-slate-400">
          Loading live operational metrics from database...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="glass-card border-rose-500/30 bg-rose-950/10 p-8 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="h-10 w-10 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white mb-2">Analytics Restricted or Unavailable</h3>
        <p className="text-xs text-rose-300 mb-6">{error || "Could not retrieve system metrics."}</p>
        <Button onClick={fetchAnalytics} variant="outline" className="border-rose-500/40 text-rose-200">
          <RefreshCw className="h-4 w-4 mr-2" /> Retry Analytics Query
        </Button>
      </Card>
    );
  }

  const maxTrend = Math.max(...data.trendMetrics.map((t) => t.count), 1);
  const resolutionPercentage =
    data.totalIssues > 0 ? Math.round((data.resolvedIssues / data.totalIssues) * 100) : 100;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 glass-card border-slate-800 p-6 sm:p-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <BarChart3 className="h-4 w-4" /> Real-time System Intelligence
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Admin Operational Analytics
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live database insights covering student occupancy, issue resolution rates, SLA performance, and staff workloads.
          </p>
        </div>

        <Button
          onClick={fetchAnalytics}
          variant="outline"
          size="sm"
          className="gap-2 border-indigo-500/30 text-indigo-300 hover:text-white"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Analytics Data
        </Button>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Students & Occupancy */}
        <Card className="glass-card border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Users className="h-20 w-20 text-indigo-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-indigo-400" /> Students & Occupancy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-white">
              {data.totalStudents}{" "}
              <span className="text-xs font-normal text-slate-400">Students</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1">
                <Bed className="h-3 w-3 text-emerald-400" /> Bed Occupancy:
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {data.occupiedBeds} / {data.totalCapacityBeds} ({data.occupancyRate}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Open Maintenance Issues */}
        <Card className="glass-card border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Wrench className="h-20 w-20 text-amber-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-amber-400" /> Active Maintenance Issues
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-amber-400">
              {data.openIssues}{" "}
              <span className="text-xs font-normal text-slate-400">Open Tickets</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Resolution Rate:
              </span>
              <span className="font-bold text-emerald-400 font-mono">
                {resolutionPercentage}% ({data.resolvedIssues} / {data.totalIssues})
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Critical & SLA Breaches */}
        <Card className="glass-card border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <ShieldAlert className="h-20 w-20 text-rose-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" /> Critical & SLA Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-rose-400">
              {data.criticalIssues}{" "}
              <span className="text-xs font-normal text-slate-400">Critical Open</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400 flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-rose-400" /> SLA Breach Rate:
              </span>
              <span className="font-bold text-rose-400 font-mono">
                {data.slaBreaches} Breaches ({data.slaBreachRate}%)
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Avg Resolution Time */}
        <Card className="glass-card border-slate-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Clock className="h-20 w-20 text-indigo-400" />
          </div>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-mono font-semibold uppercase text-slate-400 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-indigo-400" /> Resolution Velocity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-3xl font-extrabold text-indigo-300">
              {data.avgResolutionTimeHours}{" "}
              <span className="text-xs font-normal text-slate-400">Hours Avg</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/80">
              <span className="text-slate-400">Total Tracked Issues:</span>
              <span className="font-bold text-slate-200 font-mono">
                {data.totalIssues} Issues
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Breakdown & Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card className="glass-card border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="h-4 w-4 text-indigo-400" /> Issues by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.categoryMetrics.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No maintenance issues recorded yet.</p>
            ) : (
              data.categoryMetrics.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200 capitalize flex items-center gap-2">
                      {cat.category}
                      {cat.openCount > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          {cat.openCount} Open
                        </span>
                      )}
                    </span>
                    <span className="font-mono text-slate-400">
                      {cat.count} tickets ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Hostel Distribution */}
        <Card className="glass-card border-slate-800">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-400" /> Issues by Hostel Block
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {data.hostelMetrics.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No hostel-linked issues recorded yet.</p>
            ) : (
              data.hostelMetrics.map((hostel) => {
                const percent =
                  data.totalIssues > 0 ? Math.round((hostel.totalIssues / data.totalIssues) * 100) : 0;
                return (
                  <div key={hostel.hostelId} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200 flex items-center gap-2">
                        <Building2 className="h-3.5 w-3.5 text-amber-400" /> {hostel.hostelName}
                      </span>
                      <span className="font-mono text-slate-400">
                        {hostel.openIssues} Open / {hostel.totalIssues} Total ({percent}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-900 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Staff Workload */}
        <Card className="glass-card border-slate-800 lg:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-emerald-400" /> Maintenance Staff Active Workload
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.staffWorkloadMetrics.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">No registered maintenance staff found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px]">
                    <tr>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Email Contact</th>
                      <th className="p-3">Active Assigned Tickets</th>
                      <th className="p-3">Workload Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {data.staffWorkloadMetrics.map((staff) => {
                      const count = staff.activeAssignments;
                      let workloadBadge = (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                          Light Workload
                        </span>
                      );
                      if (count >= 5) {
                        workloadBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                            Heavy Workload
                          </span>
                        );
                      } else if (count >= 2) {
                        workloadBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                            Moderate Workload
                          </span>
                        );
                      }

                      return (
                        <tr key={staff.staffId} className="hover:bg-slate-900/40">
                          <td className="p-3 font-semibold text-white">{staff.fullName}</td>
                          <td className="p-3 font-mono text-slate-400">{staff.email}</td>
                          <td className="p-3 font-bold font-mono text-indigo-300">
                            {count} active tasks
                          </td>
                          <td className="p-3">{workloadBadge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 30-Day Issue Activity Trend */}
        <Card className="glass-card border-slate-800 lg:col-span-2">
          <CardHeader className="pb-4 flex flex-row items-center justify-between">
            <CardTitle className="text-base font-bold text-white flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" /> 30-Day Issue Creation Trend
            </CardTitle>
            <span className="text-xs font-mono text-slate-400">Daily Reported Count</span>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-40 flex items-end justify-between gap-1 border-b border-slate-800 pb-2">
              {data.trendMetrics.map((trend) => {
                const heightPercent = maxTrend > 0 ? (trend.count / maxTrend) * 100 : 0;
                return (
                  <div
                    key={trend.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative"
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute -top-8 bg-slate-900 text-white text-[10px] font-mono px-2 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-slate-700">
                      {trend.date}: {trend.count} issues
                    </div>

                    <div
                      className="w-full bg-gradient-to-t from-indigo-600 to-violet-500 rounded-t min-h-[4px] group-hover:from-indigo-400 group-hover:to-violet-400 transition-colors"
                      style={{ height: `${Math.max(heightPercent, 4)}%` }}
                    />
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between pt-3 text-[10px] font-mono text-slate-400">
              <span>{data.trendMetrics[0]?.date || "30 Days Ago"}</span>
              <span>{data.trendMetrics[14]?.date || "15 Days Ago"}</span>
              <span>Today</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
