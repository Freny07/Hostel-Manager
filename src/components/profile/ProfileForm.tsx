"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Shield, 
  Building2, 
  Bed, 
  Save, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Calendar 
} from "lucide-react";

export interface ProfileData {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  roll_number: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  created_at: string;
  roles?: {
    name: string;
  } | null;
}

export interface AllocationData {
  id: string;
  start_date: string;
  status: string;
  beds?: {
    bed_label: string;
    rooms?: {
      room_number: string;
      room_type: string;
      floors?: {
        floor_number: number;
        hostels?: {
          name: string;
          code: string;
        } | null;
      } | null;
    } | null;
  } | null;
}

interface ProfileFormProps {
  initialProfile: ProfileData;
  initialAllocation: AllocationData | null;
}

export function ProfileForm({ initialProfile, initialAllocation }: ProfileFormProps) {
  const router = useRouter();
  
  const [firstName, setFirstName] = useState(initialProfile.first_name || "");
  const [lastName, setLastName] = useState(initialProfile.last_name || "");
  const [phone, setPhone] = useState(initialProfile.phone || "");
  const [rollNumber, setRollNumber] = useState(initialProfile.roll_number || "");
  const [emergencyName, setEmergencyName] = useState(initialProfile.emergency_contact_name || "");
  const [emergencyPhone, setEmergencyPhone] = useState(initialProfile.emergency_contact_phone || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const roleName = initialProfile.roles?.name || "student";

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    try {
      setLoading(true);
      const supabase = createBrowserClient();

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: phone.trim() || null,
          roll_number: rollNumber.trim() || null,
          emergency_contact_name: emergencyName.trim() || null,
          emergency_contact_phone: emergencyPhone.trim() || null,
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", initialProfile.id);

      if (updateError) {
        if (updateError.message.includes("Could not find the table") || updateError.message.includes("profiles")) {
          setError(
            "Database tables are not created on your Supabase project yet. Please run the SQL migration in your Supabase SQL Editor."
          );
        } else {
          setError(updateError.message);
        }
        return;
      }

      setSuccessMsg("Profile information updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const hostelInfo = initialAllocation?.beds?.rooms?.floors?.hostels;
  const floorInfo = initialAllocation?.beds?.rooms?.floors;
  const roomInfo = initialAllocation?.beds?.rooms;
  const bedInfo = initialAllocation?.beds;

  return (
    <div className="space-y-8">
      {/* Top Banner / Avatar Header */}
      <Card className="glass-card border-slate-800 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Box */}
          <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-xl shadow-indigo-500/20 text-white font-bold text-2xl border border-violet-400/30 overflow-hidden shrink-0">
            {initialProfile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={initialProfile.avatar_url}
                alt={`${initialProfile.first_name}'s avatar`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {firstName.charAt(0).toUpperCase()}
                {lastName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {firstName} {lastName}
                </h1>
                <p className="text-sm text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5 text-slate-500" />
                  {initialProfile.email}
                </p>
              </div>

              <div className="flex items-center justify-center sm:justify-start gap-2 pt-2 sm:pt-0">
                <Badge variant="accent" className="capitalize text-xs px-3 py-1 font-semibold flex items-center gap-1">
                  <Shield className="h-3.5 w-3.5" />
                  {roleName}
                </Badge>

                {rollNumber && (
                  <Badge variant="secondary" className="font-mono text-xs px-3 py-1">
                    #{rollNumber}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-xs text-slate-500 pt-1">
              Member since {new Date(initialProfile.created_at).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      </Card>

      {/* Main Grid: Edit Form (2 cols) & Accommodation Overview (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Edit Form */}
        <Card className="glass-card border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <User className="h-5 w-5 text-violet-400" />
              Personal & Contact Details
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Update your personal contact numbers and emergency contact information.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleUpdate} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-400">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="flex items-center gap-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{successMsg}</span>
                </div>
              )}

              {/* Name Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
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
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Contact & Roll Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rollNumber">Roll / Student ID</Label>
                  <Input
                    id="rollNumber"
                    placeholder="STU-2026-88"
                    value={rollNumber}
                    onChange={(e) => setRollNumber(e.target.value)}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Read-only System Security Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <Label className="text-slate-400">Account Email (Read-Only)</Label>
                  <Input
                    value={initialProfile.email}
                    disabled
                    className="bg-slate-900/40 text-slate-400 border-slate-800 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-400">Assigned Role (Read-Only)</Label>
                  <Input
                    value={roleName.toUpperCase()}
                    disabled
                    className="bg-slate-900/40 text-slate-400 border-slate-800 cursor-not-allowed font-semibold"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
                  <UserCheck className="h-4 w-4 text-violet-400" />
                  Emergency Contact Details
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyName">Contact Name</Label>
                    <Input
                      id="emergencyName"
                      placeholder="Parent / Guardian Name"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="emergencyPhone">Contact Phone</Label>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      placeholder="+1 (555) 999-8888"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="glow" size="lg" disabled={loading} className="gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Profile Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Accommodation / Room Allocation Card */}
        <Card className="glass-card border-slate-800 h-fit">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-400" />
              Room Accommodation
            </CardTitle>
            <CardDescription className="text-slate-400 text-sm">
              Your active hostel block and bed assignment details.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {initialAllocation && bedInfo && roomInfo && floorInfo && hostelInfo ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="success" className="text-xs">
                      ACTIVE ALLOCATION
                    </Badge>
                    <span className="text-xs font-mono text-indigo-300 font-medium">
                      {hostelInfo.code}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white">
                    {hostelInfo.name}
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-300 pt-2 border-t border-indigo-500/20">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Floor Level</span>
                      <span className="font-semibold text-white">Floor {floorInfo.floor_number}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Room Number</span>
                      <span className="font-semibold text-white">Room {roomInfo.room_number}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Assigned Bed</span>
                      <span className="font-semibold text-emerald-400 font-mono">Bed {bedInfo.bed_label}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Room Type</span>
                      <span className="font-semibold text-white capitalize">{roomInfo.room_type}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-lg border border-slate-800 bg-slate-950/60">
                  <Calendar className="h-4 w-4 text-violet-400 shrink-0" />
                  <span>
                    Occupied since{" "}
                    <strong className="text-slate-200">
                      {new Date(initialAllocation.start_date).toLocaleDateString()}
                    </strong>
                  </span>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-center space-y-3">
                <div className="mx-auto h-12 w-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <Bed className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                  <Badge variant="secondary" className="mb-2">
                    Unallocated Resident
                  </Badge>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    No active bed assignment is recorded yet. Room allocation will appear here once assigned by the Warden.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
