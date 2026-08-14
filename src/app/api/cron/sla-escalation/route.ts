import { NextResponse } from "next/server";
import { processSlaEscalationsAction } from "@/app/issues/issue-actions";

export async function GET() {
  try {
    const res = await processSlaEscalationsAction();
    return NextResponse.json(res);
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "SLA escalation failed" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
