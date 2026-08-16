"use server";

import { redirect } from "next/navigation";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { IssueList } from "@/components/issues/IssueList";
import {
  getIssuesAction,
  getStudentActiveResidenceAction,
  getHostelsListAction,
} from "./issue-actions";

export default async function IssuesPage() {
  const { role } = await getUserRoleAndProfile();
  const effectiveRole = role || "admin";
  const isStudent = effectiveRole === "student";

  const [issuesRes, residenceRes, hostelsRes] = await Promise.all([
    getIssuesAction("all"),
    getStudentActiveResidenceAction(),
    getHostelsListAction(),
  ]);

  const issues = issuesRes.success && issuesRes.data ? issuesRes.data : [];
  const residenceContext = residenceRes.success && residenceRes.data ? residenceRes.data : null;
  const hostelsList = hostelsRes.success && hostelsRes.data ? hostelsRes.data : [];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <IssueList
          initialIssues={issues}
          residenceContext={residenceContext}
          isStudent={isStudent}
          hostelsList={hostelsList}
        />
      </main>
      <Footer />
    </div>
  );
}
