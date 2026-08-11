import { 
  hasPermissionInRole, 
  hasAllPermissionsInRole, 
  hasAnyPermissionInRole 
} from "../permissions";

export function runRbacTests(): { success: boolean; passed: number; failed: number; log: string[] } {
  const log: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      passed++;
      log.push(`✔ PASS: ${description}`);
    } else {
      failed++;
      log.push(`✖ FAIL: ${description}`);
    }
  }

  // 1. Student permissions
  assert(hasPermissionInRole("student", "profile:read"), "Student has profile:read");
  assert(hasPermissionInRole("student", "tickets:create"), "Student has tickets:create");
  assert(!hasPermissionInRole("student", "allocations:manage"), "Student lacks allocations:manage");
  assert(!hasPermissionInRole("student", "admin:all"), "Student lacks admin:all");

  // 2. Warden permissions
  assert(hasPermissionInRole("warden", "allocations:manage"), "Warden has allocations:manage");
  assert(hasPermissionInRole("warden", "gatepass:manage"), "Warden has gatepass:manage");
  assert(hasPermissionInRole("warden", "tickets:manage"), "Warden has tickets:manage");
  assert(!hasPermissionInRole("warden", "admin:all"), "Warden lacks admin:all");

  // 3. Maintenance permissions
  assert(hasPermissionInRole("maintenance", "tickets:read_assigned"), "Maintenance has tickets:read_assigned");
  assert(hasPermissionInRole("maintenance", "tickets:update_assigned"), "Maintenance has tickets:update_assigned");
  assert(!hasPermissionInRole("maintenance", "gatepass:manage"), "Maintenance lacks gatepass:manage");

  // 4. Admin permissions (master wildcard)
  assert(hasPermissionInRole("admin", "admin:all"), "Admin has admin:all");
  assert(hasPermissionInRole("admin", "allocations:manage"), "Admin has allocations:manage");
  assert(hasPermissionInRole("admin", "tickets:manage"), "Admin has tickets:manage");

  // 5. Multiple permissions check
  assert(
    hasAllPermissionsInRole("warden", ["profile:read", "allocations:manage"]),
    "Warden has all of [profile:read, allocations:manage]"
  );
  assert(
    !hasAllPermissionsInRole("student", ["profile:read", "allocations:manage"]),
    "Student does NOT have all of [profile:read, allocations:manage]"
  );
  assert(
    hasAnyPermissionInRole("student", ["allocations:manage", "profile:read"]),
    "Student has any of [allocations:manage, profile:read]"
  );

  return {
    success: failed === 0,
    passed,
    failed,
    log,
  };
}
