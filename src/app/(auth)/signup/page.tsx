"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Building2, ArrowRight, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

export default function SignUpPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createBrowserClient();
      
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      // If Supabase session is established right away
      if (data.session) {
        router.push("/");
        router.refresh();
      } else {
        setSuccessMsg(
          "Account created successfully! Please check your email inbox to confirm your registration."
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100 relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-violet-600/15 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Brand Header */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 group">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
          <Building2 className="h-6 w-6 text-white" />
        </div>
        <span className="font-bold text-2xl tracking-tight text-white">
          Hostel<span className="gradient-text">OS</span>
        </span>
      </Link>

      <Card className="w-full max-w-md glass-card border-slate-800 shadow-2xl">
        <CardHeader className="space-y-2 text-center pb-4">
          <CardTitle className="text-2xl font-bold text-white">Create Account</CardTitle>
          <CardDescription className="text-slate-400 text-sm">
            Register for a new student resident account
          </CardDescription>
        </CardHeader>

        <CardContent>
          {successMsg ? (
            <div className="space-y-4 text-center py-4">
              <div className="mx-auto h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-300">{successMsg}</p>
              <Link href="/login" className={buttonVariants({ variant: "outline", className: "w-full text-center flex justify-center items-center h-10 px-5 py-2 text-sm font-medium border border-slate-700 bg-slate-900/50 text-slate-200 hover:bg-slate-800 rounded-lg" })}>
                Return to Login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    placeholder="Alex"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Morgan"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="alex.morgan@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <Button
                type="submit"
                variant="glow"
                size="lg"
                className="w-full mt-2 gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Register
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>

        {!successMsg && (
          <CardFooter className="flex justify-center border-t border-slate-800/80 pt-4">
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-violet-400 hover:text-violet-300 font-semibold hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>

      <div className="mt-8 text-center text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-300 transition-colors">
          ← Back to Homepage
        </Link>
      </div>
    </div>
  );
}
