import { NextRequest, NextResponse } from "next/server";
import { processSlaEscalationsAction } from "@/app/issues/issue-actions";

export async function GET(req: NextRequest) {
  // Security Hardening: Enforce Bearer token authorization if CRON_SECRET is configured
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: "Unauthorized cron request." },
      { status: 401 }
    );
  }

  try {
    const res = await processSlaEscalationsAction();
    return NextResponse.json(res);
  } catch (err) {
    console.error("[Cron SLA Escalation Exception]:", err);
    return NextResponse.json(
      { success: false, error: "SLA escalation process failed." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
