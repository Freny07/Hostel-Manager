"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldAlert, FileQuestion } from "lucide-react";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { IssueDetailView } from "@/components/issues/IssueDetailView";
import { getIssueDetailAction } from "@/app/issues/issue-actions";

interface IssueDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const { id } = await params;
  const { user, role } = await getUserRoleAndProfile();

  if (!user) {
    redirect(`/login?next=/issues/${id}`);
  }

  const isStudent = role === "student";
  const issueRes = await getIssueDetailAction(id);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      <Navbar />
      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {!issueRes.success || !issueRes.data ? (
          /* Error State: Nonexistent Issue or Unauthorized Access */
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center max-w-xl mx-auto space-y-5 my-12 shadow-2xl">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 mx-auto">
              {issueRes.error?.includes("Unauthorized") ? (
                <ShieldAlert className="h-8 w-8" />
              ) : (
                <FileQuestion className="h-8 w-8" />
              )}
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-extrabold text-white">
                {issueRes.error?.includes("Unauthorized")
                  ? "Access Restricted"
                  : "Issue Ticket Not Found"}
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                {issueRes.error ||
                  "The requested maintenance issue record does not exist or you do not have permission to view it."}
              </p>
            </div>

            <div className="pt-2">
              <Link href="/issues">
                <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold">
                  <ArrowLeft className="h-4 w-4" />
                  Return to Issues Directory
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <IssueDetailView issue={issueRes.data} isStudent={isStudent} />
        )}
      </main>
      <Footer />
    </div>
  );
}
