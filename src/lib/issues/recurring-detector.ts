/**
 * Deterministic & Explainable Recurring Issue Detection Algorithm
 */

export interface MinimalIssueForRecurring {
  id: string;
  room_id?: string | null;
  hostel_id?: string | null;
  category: string;
  created_at: string;
  title: string;
  status: string;
  priority: string;
  room?: { room_number: string } | null;
  hostel?: { name: string } | null;
}

export interface RecurringAnalysisResult {
  isRecurring: boolean;
  confidence: "high" | "moderate" | "none";
  score: number;
  reason: string;
  historicalCount: number;
  sameRoomCount: number;
  sameHostelCount: number;
  daysWindow: number;
  previousIssues: MinimalIssueForRecurring[];
}

/**
 * Deterministically analyzes issue history for a specific room/location and category.
 */
export function analyzeRecurringPattern(
  targetIssue: MinimalIssueForRecurring,
  history: MinimalIssueForRecurring[]
): RecurringAnalysisResult {
  if (!targetIssue || !targetIssue.created_at) {
    return {
      isRecurring: false,
      confidence: "none",
      score: 0,
      reason: "Insufficient issue data for analysis.",
      historicalCount: 0,
      sameRoomCount: 0,
      sameHostelCount: 0,
      daysWindow: 0,
      previousIssues: [],
    };
  }

  const targetTime = new Date(targetIssue.created_at).getTime();
  const roomNumber = targetIssue.room?.room_number ? `Room ${targetIssue.room.room_number}` : "this room";
  const hostelName = targetIssue.hostel?.name || "this hostel block";
  const category = targetIssue.category ? targetIssue.category.toLowerCase() : "maintenance";

  // Filter valid history excluding target itself and future issues
  const relevantHistory = history.filter((h) => {
    if (h.id === targetIssue.id) return false;
    const hTime = new Date(h.created_at).getTime();
    return hTime <= targetTime;
  });

  // 1. Same Room + Same Category matches
  const sameRoomCatMatches = relevantHistory.filter((h) => {
    const isSameRoom = Boolean(targetIssue.room_id && h.room_id && h.room_id === targetIssue.room_id);
    const isSameCat = h.category?.toLowerCase() === category;
    return isSameRoom && isSameCat;
  });

  // Time window filters for same room
  const in30DaysRoom = sameRoomCatMatches.filter((h) => {
    const diffDays = (targetTime - new Date(h.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30;
  });

  const in60DaysRoom = sameRoomCatMatches.filter((h) => {
    const diffDays = (targetTime - new Date(h.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 60;
  });

  const in90DaysRoom = sameRoomCatMatches.filter((h) => {
    const diffDays = (targetTime - new Date(h.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 90;
  });

  // 2. Same Hostel + Same Category matches
  const sameHostelCatMatches = relevantHistory.filter((h) => {
    const isSameHostel = Boolean(targetIssue.hostel_id && h.hostel_id && h.hostel_id === targetIssue.hostel_id);
    const isSameCat = h.category?.toLowerCase() === category;
    return isSameHostel && isSameCat;
  });

  const in30DaysHostel = sameHostelCatMatches.filter((h) => {
    const diffDays = (targetTime - new Date(h.created_at).getTime()) / (1000 * 3600 * 24);
    return diffDays <= 30;
  });

  // Total count including target issue
  const totalRoomCount = sameRoomCatMatches.length + 1;
  const totalHostelCount = sameHostelCatMatches.length + 1;

  // Rule 1: High confidence room recurrence (>= 3 room complaints within 60 days)
  if (in60DaysRoom.length >= 2) {
    return {
      isRecurring: true,
      confidence: "high",
      score: 90,
      reason: `${in60DaysRoom.length + 1} ${category} complaints reported in ${roomNumber} within the last 60 days.`,
      historicalCount: totalRoomCount,
      sameRoomCount: totalRoomCount,
      sameHostelCount: totalHostelCount,
      daysWindow: 60,
      previousIssues: in60DaysRoom,
    };
  }

  // Rule 2: High confidence room recurrence (2 room complaints within 30 days)
  if (in30DaysRoom.length >= 1) {
    return {
      isRecurring: true,
      confidence: "high",
      score: 85,
      reason: `${in30DaysRoom.length + 1} ${category} complaints reported in ${roomNumber} within the last 30 days.`,
      historicalCount: totalRoomCount,
      sameRoomCount: totalRoomCount,
      sameHostelCount: totalHostelCount,
      daysWindow: 30,
      previousIssues: in30DaysRoom,
    };
  }

  // Rule 3: Moderate confidence room recurrence (2 room complaints within 90 days)
  if (in90DaysRoom.length >= 1) {
    return {
      isRecurring: true,
      confidence: "moderate",
      score: 70,
      reason: `${in90DaysRoom.length + 1} ${category} complaints reported in ${roomNumber} within the last 90 days.`,
      historicalCount: totalRoomCount,
      sameRoomCount: totalRoomCount,
      sameHostelCount: totalHostelCount,
      daysWindow: 90,
      previousIssues: in90DaysRoom,
    };
  }

  // Rule 4: Moderate confidence hostel block pattern (>= 4 complaints in same hostel block in 30 days)
  if (in30DaysHostel.length >= 3) {
    return {
      isRecurring: true,
      confidence: "moderate",
      score: 65,
      reason: `${in30DaysHostel.length + 1} ${category} complaints reported in ${hostelName} within the last 30 days.`,
      historicalCount: totalHostelCount,
      sameRoomCount: totalRoomCount,
      sameHostelCount: totalHostelCount,
      daysWindow: 30,
      previousIssues: in30DaysHostel,
    };
  }

  // Fallback: No significant recurrence pattern detected
  return {
    isRecurring: false,
    confidence: "none",
    score: 0,
    reason: "No significant recurring issue pattern detected.",
    historicalCount: 1,
    sameRoomCount: totalRoomCount,
    sameHostelCount: totalHostelCount,
    daysWindow: 0,
    previousIssues: [],
  };
}
