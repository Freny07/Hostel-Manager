import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { 
  hasAllPermissionsInRole, 
  hasAnyPermissionInRole 
} from "./permissions";
import type { AppRole, AppPermission, ProfileRow, AuthorizationResult } from "./types";

/**
 * Server-side helper to fetch the active authenticated user along with their verified database profile and role.
 * Never relies on client-submitted roles; strictly reads from public.profiles -> public.roles.
 */
export async function getUserRoleAndProfile(): Promise<{
  user: import("@supabase/supabase-js").User | null;
  profile: ProfileRow | null;
  role: AppRole | null;
}> {
  const supabase = await createServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null, role: null };
  }

  // Query profiles table joined with roles(name) for the authenticated user
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*, roles(name)")
    .eq("id", user.id)
    .single();

  if (!profileData) {
    // Fail closed: Profile record not found
    return { user, profile: null, role: null };
  }

  const profile = profileData as unknown as ProfileRow;
  const rawRoleName = profile.roles?.name?.toLowerCase();

  const role: AppRole | null =
    rawRoleName === "admin" ||
    rawRoleName === "warden" ||
    rawRoleName === "maintenance" ||
    rawRoleName === "staff" ||
    rawRoleName === "student"
      ? (rawRoleName as AppRole)
      : "student"; // Default safe resident fallback if role exists in profile

  return { user, profile, role };
}

/**
 * Server-side helper to evaluate if the current user possesses one of the required roles.
 */
export async function checkRole(
  requiredRoles: AppRole | AppRole[]
): Promise<AuthorizationResult> {
  const { user, profile, role } = await getUserRoleAndProfile();

  if (!user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      role: null,
      reason: "User is not authenticated.",
    };
  }

  if (!role || !profile) {
    return {
      authorized: false,
      user,
      profile: null,
      role: null,
      reason: "User database profile or role could not be resolved.",
    };
  }

  const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
  const isAuthorized = rolesArray.includes(role);

  return {
    authorized: isAuthorized,
    user,
    profile,
    role,
    reason: isAuthorized ? undefined : `Role '${role}' is not in required roles [${rolesArray.join(", ")}].`,
  };
}

/**
 * Server-side helper to evaluate if the current user possesses required permissions.
 */
export async function checkPermission(
  requiredPermissions: AppPermission | AppPermission[],
  mode: "any" | "all" = "any"
): Promise<AuthorizationResult> {
  const { user, profile, role } = await getUserRoleAndProfile();

  if (!user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      role: null,
      reason: "User is not authenticated.",
    };
  }

  if (!role || !profile) {
    return {
      authorized: false,
      user,
      profile: null,
      role: null,
      reason: "User database profile or role could not be resolved.",
    };
  }

  const permissionsArray = Array.isArray(requiredPermissions)
    ? requiredPermissions
    : [requiredPermissions];

  const isAuthorized =
    mode === "all"
      ? hasAllPermissionsInRole(role, permissionsArray)
      : hasAnyPermissionInRole(role, permissionsArray);

  return {
    authorized: isAuthorized,
    user,
    profile,
    role,
    reason: isAuthorized
      ? undefined
      : `Role '${role}' lacks required permissions [${permissionsArray.join(", ")}].`,
  };
}

/**
 * Guard function for Server Components, Actions, or Route Handlers.
 * Enforces role authorization and automatically redirects unauthorized users.
 */
export async function requireRole(
  requiredRoles: AppRole | AppRole[],
  redirectTo: string = "/login"
): Promise<AuthorizationResult> {
  const result = await checkRole(requiredRoles);

  if (!result.authorized) {
    redirect(redirectTo);
  }

  return result;
}

/**
 * Guard function for Server Components, Actions, or Route Handlers.
 * Enforces permission authorization and automatically redirects unauthorized users.
 */
export async function requirePermission(
  requiredPermissions: AppPermission | AppPermission[],
  mode: "any" | "all" = "any",
  redirectTo: string = "/login"
): Promise<AuthorizationResult> {
  const result = await checkPermission(requiredPermissions, mode);

  if (!result.authorized) {
    redirect(redirectTo);
  }

  return result;
}
