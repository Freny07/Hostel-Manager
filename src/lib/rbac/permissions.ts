import type { AppRole, AppPermission } from "./types";

const ALL_PERMISSIONS: AppPermission[] = [
  "profile:read",
  "profile:write_own",
  "hostels:read",
  "hostels:manage",
  "rooms:read",
  "rooms:manage",
  "allocations:read_own",
  "allocations:manage",
  "gatepass:create",
  "gatepass:read_own",
  "gatepass:manage",
  "tickets:create",
  "tickets:read_own",
  "tickets:read_assigned",
  "tickets:update_assigned",
  "tickets:manage",
  "admin:all",
];

export const ROLE_PERMISSIONS: Record<AppRole, Set<AppPermission>> = {
  student: new Set([
    "profile:read",
    "profile:write_own",
    "allocations:read_own",
    "gatepass:create",
    "gatepass:read_own",
    "tickets:create",
    "tickets:read_own",
  ]),

  warden: new Set([
    "profile:read",
    "profile:write_own",
    "allocations:read_own",
    "gatepass:create",
    "gatepass:read_own",
    "tickets:create",
    "tickets:read_own",
    "hostels:read",
    "rooms:read",
    "allocations:manage",
    "gatepass:manage",
    "tickets:manage",
  ]),

  maintenance: new Set([
    "profile:read",
    "rooms:read",
    "tickets:read_assigned",
    "tickets:update_assigned",
  ]),

  staff: new Set([
    "profile:read",
    "rooms:read",
    "tickets:read_assigned",
    "tickets:update_assigned",
  ]),

  admin: new Set(ALL_PERMISSIONS),
};

/**
 * Pure helper function to verify if a role possesses a specific permission.
 */
export function hasPermissionInRole(
  role: AppRole,
  permission: AppPermission
): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;

  // Admin possesses master wildcard or full permission set
  if (permissions.has("admin:all")) return true;

  return permissions.has(permission);
}

/**
 * Pure helper function to verify if a role possesses all specified permissions.
 */
export function hasAllPermissionsInRole(
  role: AppRole,
  permissions: AppPermission[]
): boolean {
  if (permissions.length === 0) return true;
  return permissions.every((perm) => hasPermissionInRole(role, perm));
}

/**
 * Pure helper function to verify if a role possesses at least one of the specified permissions.
 */
export function hasAnyPermissionInRole(
  role: AppRole,
  permissions: AppPermission[]
): boolean {
  if (permissions.length === 0) return true;
  return permissions.some((perm) => hasPermissionInRole(role, perm));
}
