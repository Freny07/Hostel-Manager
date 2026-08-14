"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { getUserRoleAndProfile } from "@/lib/rbac/auth-checks";

export type NotificationType =
  | "issue_created"
  | "issue_assigned"
  | "issue_status_changed"
  | "issue_commented"
  | "issue_resolved"
  | "issue_escalated";

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: NotificationType;
  issue_id?: string | null;
  is_read: boolean;
  read_at?: string | null;
  created_at: string;
}

export interface NotificationActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Server Helper: Create an in-app notification (skips self-notifications)
 */
export async function createNotificationInternal({
  userId,
  title,
  message,
  type,
  issueId,
  actorUserId,
}: {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  issueId?: string;
  actorUserId?: string;
}): Promise<boolean> {
  // Prevent notifying users of their own actions
  if (actorUserId && userId === actorUserId) {
    return false;
  }

  if (!userId || !title || !message) {
    return false;
  }

  try {
    const supabase = await createServerClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const notificationsTable = (supabase as any).from("notifications");

    await notificationsTable.insert({
      user_id: userId,
      title,
      message,
      type,
      issue_id: issueId || null,
      is_read: false,
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Server Action: Fetch authenticated user's notifications & unread count
 */
export async function getNotificationsAction(): Promise<
  NotificationActionResult<{ notifications: NotificationItem[]; unreadCount: number }>
> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationsTable = (supabase as any).from("notifications");

  const { data: records, error } = await notificationsTable
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    return { success: false, error: error.message };
  }

  const notifications = (records || []) as NotificationItem[];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    success: true,
    data: {
      notifications,
      unreadCount,
    },
  };
}

/**
 * Server Action: Mark a single notification as read
 */
export async function markNotificationReadAction(
  notificationId: string
): Promise<NotificationActionResult<null>> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  if (!notificationId) {
    return { success: false, error: "Notification ID is required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationsTable = (supabase as any).from("notifications");

  const { error } = await notificationsTable
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/issues");

  return { success: true, data: null };
}

/**
 * Server Action: Mark all notifications as read for current user
 */
export async function markAllNotificationsReadAction(): Promise<
  NotificationActionResult<null>
> {
  const { user } = await getUserRoleAndProfile();

  if (!user) {
    return { success: false, error: "Authentication required." };
  }

  const supabase = await createServerClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notificationsTable = (supabase as any).from("notifications");

  const { error } = await notificationsTable
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/issues");

  return { success: true, data: null };
}
