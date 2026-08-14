"use server";

import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";

export interface CategoryMetric {
  category: string;
  count: number;
  openCount: number;
  percentage: number;
}

export interface HostelMetric {
  hostelId: string;
  hostelName: string;
  totalIssues: number;
  openIssues: number;
}

export interface StaffWorkloadMetric {
  staffId: string;
  fullName: string;
  email: string;
  activeAssignments: number;
}

export interface TrendMetric {
  date: string;
  count: number;
}

export interface RecurringHotspotMetric {
  locationName: string;
  category: string;
  count60Days: number;
  latestTicketTitle: string;
  latestCreated: string;
  confidence: "high" | "moderate";
}

export interface AnalyticsData {
  totalStudents: number;
  totalCapacityBeds: number;
  occupiedBeds: number;
  occupancyRate: number;

  totalIssues: number;
  openIssues: number;
  resolvedIssues: number;
  criticalIssues: number;

  slaBreaches: number;
  slaBreachRate: number;
  avgResolutionTimeHours: number;

  categoryMetrics: CategoryMetric[];
  hostelMetrics: HostelMetric[];
  staffWorkloadMetrics: StaffWorkloadMetric[];
  trendMetrics: TrendMetric[];
  recurringHotspots: RecurringHotspotMetric[];
}

export interface AnalyticsActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Action: Fetches real-time operational analytics for Admin Dashboard.
 * Access restricted exclusively to Admin users.
 */
export async function getAdminAnalyticsDataAction(): Promise<
  AnalyticsActionResult<AnalyticsData>
> {
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (role !== "admin") {
    return {
      success: false,
      error: "Access Restricted: Admin privileges are required to view analytics.",
    };
  }

  const supabase = await createServerClient();

  try {
    // 1. Total Students & Staff counts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilesTable = (supabase as any).from("profiles");
    const { count: totalStudentsCount } = await profilesTable
      .select("*", { count: "exact", head: true })
      .eq("role", "student");

    // 2. Bed Occupancy Metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bedsTable = (supabase as any).from("beds");
    const { count: totalBeds } = await bedsTable.select("*", { count: "exact", head: true });
    const { count: occupiedBedsCount } = await bedsTable
      .select("*", { count: "exact", head: true })
      .eq("status", "occupied");

    const capacityBeds = totalBeds || 0;
    const occupied = occupiedBedsCount || 0;
    const occupancyRate = capacityBeds > 0 ? Math.round((occupied / capacityBeds) * 100) : 0;

    // 3. Issue Metrics
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const issuesTable = (supabase as any).from("issues");
    const { data: issuesData, error: issuesErr } = await issuesTable.select(
      "id, title, category, status, priority, is_overdue, is_escalated, sla_deadline, created_at, updated_at, hostel_id, room_id, hostel:hostels!issues_hostel_id_fkey(id, name), room:rooms!issues_room_id_fkey(room_number)"
    );

    if (issuesErr) {
      return { success: false, error: issuesErr.message };
    }

    const allIssues = issuesData || [];
    const totalIssues = allIssues.length;

    let openIssues = 0;
    let resolvedIssues = 0;
    let criticalIssues = 0;
    let slaBreaches = 0;
    let totalResolutionTimeMs = 0;
    let resolvedCountWithTime = 0;

    const categoryMap: Record<string, { count: number; openCount: number }> = {};
    const hostelMap: Record<string, { name: string; total: number; open: number }> = {};
    const trendMap: Record<string, number> = {};

    const now = new Date().getTime();

    // Process 30-day date range array
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      trendMap[dateStr] = 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allIssues.forEach((issue: any) => {
      const isOpen = issue.status !== "resolved";
      if (isOpen) openIssues++;
      else resolvedIssues++;

      if (isOpen && (issue.priority === "critical" || issue.priority === "urgent")) {
        criticalIssues++;
      }

      // Check SLA breaches
      const deadline = issue.sla_deadline ? new Date(issue.sla_deadline).getTime() : null;
      const isBreached =
        issue.is_overdue ||
        issue.is_escalated ||
        (deadline && (isOpen ? now > deadline : new Date(issue.updated_at).getTime() > deadline));

      if (isBreached) slaBreaches++;

      // Resolution time calculation for resolved issues
      if (!isOpen && issue.created_at && issue.updated_at) {
        const createdMs = new Date(issue.created_at).getTime();
        const resolvedMs = new Date(issue.updated_at).getTime();
        if (resolvedMs > createdMs) {
          totalResolutionTimeMs += resolvedMs - createdMs;
          resolvedCountWithTime++;
        }
      }

      // Category breakdown
      const cat = issue.category || "other";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, openCount: 0 };
      categoryMap[cat].count++;
      if (isOpen) categoryMap[cat].openCount++;

      // Hostel breakdown
      if (issue.hostel && issue.hostel_id) {
        const hId = issue.hostel_id;
        const hName = issue.hostel.name || "Unknown Hostel";
        if (!hostelMap[hId]) hostelMap[hId] = { name: hName, total: 0, open: 0 };
        hostelMap[hId].total++;
        if (isOpen) hostelMap[hId].open++;
      }

      // 30-day trend
      if (issue.created_at) {
        const dateStr = issue.created_at.split("T")[0];
        if (trendMap[dateStr] !== undefined) {
          trendMap[dateStr]++;
        }
      }
    });

    const slaBreachRate = totalIssues > 0 ? Math.round((slaBreaches / totalIssues) * 100) : 0;
    const avgResolutionTimeHours =
      resolvedCountWithTime > 0
        ? Math.round((totalResolutionTimeMs / (resolvedCountWithTime * 3600000)) * 10) / 10
        : 0;

    // Convert category map to list
    const categoryMetrics: CategoryMetric[] = Object.entries(categoryMap).map(
      ([cat, info]) => ({
        category: cat,
        count: info.count,
        openCount: info.openCount,
        percentage: totalIssues > 0 ? Math.round((info.count / totalIssues) * 100) : 0,
      })
    );
    categoryMetrics.sort((a, b) => b.count - a.count);

    // Convert hostel map to list
    const hostelMetrics: HostelMetric[] = Object.entries(hostelMap).map(([hId, info]) => ({
      hostelId: hId,
      hostelName: info.name,
      totalIssues: info.total,
      openIssues: info.open,
    }));
    hostelMetrics.sort((a, b) => b.totalIssues - a.totalIssues);

    // Convert trend map to list
    const trendMetrics: TrendMetric[] = Object.entries(trendMap).map(([date, count]) => ({
      date: date.slice(5), // MM-DD
      count,
    }));

    // 4. Maintenance Staff Workload
    const { data: staffProfiles } = await profilesTable
      .select("id, full_name, email, role")
      .in("role", ["staff", "warden", "maintenance"]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const assignmentsTable = (supabase as any).from("issue_assignments");
    const { data: activeAssignments } = await assignmentsTable
      .select("assigned_to")
      .eq("status", "active");

    const assignmentCounts: Record<string, number> = {};
    if (activeAssignments && Array.isArray(activeAssignments)) {
      activeAssignments.forEach((item) => {
        if (item.assigned_to) {
          assignmentCounts[item.assigned_to] = (assignmentCounts[item.assigned_to] || 0) + 1;
        }
      });
    }

    const staffWorkloadMetrics: StaffWorkloadMetric[] = (staffProfiles || []).map((st: { id: string; full_name: string | null; email: string }) => ({
      staffId: st.id,
      fullName: st.full_name || st.email.split("@")[0],
      email: st.email,
      activeAssignments: assignmentCounts[st.id] || 0,
    }));
    staffWorkloadMetrics.sort((a, b) => b.activeAssignments - a.activeAssignments);

    // 5. Compute Recurring Issue Hotspots (locations with >= 2 issues in last 60 days)
    const hotspotGroups: Record<
      string,
      { locationName: string; category: string; count: number; latestTitle: string; latestCreated: string }
    > = {};

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    allIssues.forEach((issue: any) => {
      if (!issue.created_at) return;
      const createdMs = new Date(issue.created_at).getTime();
      const diffDays = (now - createdMs) / (1000 * 3600 * 24);
      if (diffDays > 60) return; // 60-day window

      const locName = issue.room?.room_number
        ? `Room ${issue.room.room_number}`
        : issue.hostel?.name || "General Facility";
      const cat = issue.category || "maintenance";
      const key = `${locName}_${cat}`;

      if (!hotspotGroups[key]) {
        hotspotGroups[key] = {
          locationName: locName,
          category: cat,
          count: 0,
          latestTitle: issue.title,
          latestCreated: issue.created_at,
        };
      }
      hotspotGroups[key].count++;
    });

    const recurringHotspots: RecurringHotspotMetric[] = Object.values(hotspotGroups)
      .filter((h) => h.count >= 2)
      .map((h) => ({
        locationName: h.locationName,
        category: h.category,
        count60Days: h.count,
        latestTicketTitle: h.latestTitle,
        latestCreated: h.latestCreated,
        confidence: (h.count >= 3 ? "high" : "moderate") as "high" | "moderate",
      }))
      .sort((a, b) => b.count60Days - a.count60Days);

    return {
      success: true,
      data: {
        totalStudents: totalStudentsCount || 0,
        totalCapacityBeds: capacityBeds,
        occupiedBeds: occupied,
        occupancyRate,
        totalIssues,
        openIssues,
        resolvedIssues,
        criticalIssues,
        slaBreaches,
        slaBreachRate,
        avgResolutionTimeHours,
        categoryMetrics,
        hostelMetrics,
        staffWorkloadMetrics,
        trendMetrics,
        recurringHotspots,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to load admin analytics.",
    };
  }
}
