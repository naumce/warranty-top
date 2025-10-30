import { differenceInDays, format } from "date-fns";

export interface NotificationPreferences {
  enabled: boolean;
  email: boolean;
  push: boolean;
  reminders: {
    days30: boolean;
    days14: boolean;
    days7: boolean;
    days1: boolean;
    onExpiry: boolean;
  };
}

export interface WarrantyNotification {
  id: string;
  warrantyId: string;
  productName: string;
  brand?: string;
  type: "30_days" | "14_days" | "7_days" | "1_day" | "expired" | "expiring_today";
  daysLeft: number;
  expiryDate: string;
  message: string;
  urgency: "low" | "medium" | "high" | "critical";
  read: boolean;
  snoozedUntil?: string;
  createdAt: string;
}

const NOTIFICATION_STORAGE_KEY = "warranty_notifications";
const PREFERENCES_STORAGE_KEY = "notification_preferences";

export const defaultPreferences: NotificationPreferences = {
  enabled: true,
  email: false,
  push: true,
  reminders: {
    days30: true,
    days14: true,
    days7: true,
    days1: true,
    onExpiry: true,
  },
};

// Request browser notification permission
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.warn("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

// Send browser notification
export const sendBrowserNotification = (
  title: string,
  options: NotificationOptions
): void => {
  if (Notification.permission === "granted") {
    new Notification(title, {
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      ...options,
    });
  }
};

// Get notification preferences
export const getNotificationPreferences = (): NotificationPreferences => {
  const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return defaultPreferences;
    }
  }
  return defaultPreferences;
};

// Save notification preferences
export const saveNotificationPreferences = (
  preferences: NotificationPreferences
): void => {
  localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
};

// Get all notifications
export const getNotifications = (): WarrantyNotification[] => {
  const stored = localStorage.getItem(NOTIFICATION_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

// Save notifications
export const saveNotifications = (notifications: WarrantyNotification[]): void => {
  localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications));
};

// Add notification
export const addNotification = (notification: WarrantyNotification): void => {
  const notifications = getNotifications();
  // Check if notification already exists for this warranty and type
  const exists = notifications.find(
    (n) => n.warrantyId === notification.warrantyId && n.type === notification.type
  );
  if (!exists) {
    notifications.unshift(notification);
    saveNotifications(notifications);
  }
};

// Mark notification as read
export const markNotificationRead = (notificationId: string): void => {
  const notifications = getNotifications();
  const updated = notifications.map((n) =>
    n.id === notificationId ? { ...n, read: true } : n
  );
  saveNotifications(updated);
};

// Snooze notification
export const snoozeNotification = (
  notificationId: string,
  days: number
): void => {
  const notifications = getNotifications();
  const snoozedUntil = new Date();
  snoozedUntil.setDate(snoozedUntil.getDate() + days);

  const updated = notifications.map((n) =>
    n.id === notificationId
      ? { ...n, snoozedUntil: snoozedUntil.toISOString() }
      : n
  );
  saveNotifications(updated);
};

// Delete notification
export const deleteNotification = (notificationId: string): void => {
  const notifications = getNotifications();
  const filtered = notifications.filter((n) => n.id !== notificationId);
  saveNotifications(filtered);
};

// Clear all notifications
export const clearAllNotifications = (): void => {
  saveNotifications([]);
};

// Get unread count
export const getUnreadCount = (): number => {
  const notifications = getNotifications();
  return notifications.filter((n) => !n.read && !isSnoozed(n)).length;
};

// Check if notification is snoozed
export const isSnoozed = (notification: WarrantyNotification): boolean => {
  if (!notification.snoozedUntil) return false;
  return new Date(notification.snoozedUntil) > new Date();
};

// Check warranties and create notifications
export const checkWarrantiesForNotifications = (
  warranties: any[]
): WarrantyNotification[] => {
  const preferences = getNotificationPreferences();
  if (!preferences.enabled) return [];

  const today = new Date();
  const newNotifications: WarrantyNotification[] = [];

  warranties.forEach((warranty) => {
    const expiryDate = new Date(warranty.warranty_end_date);
    const daysLeft = differenceInDays(expiryDate, today);

    let shouldNotify = false;
    let type: WarrantyNotification["type"] | null = null;
    let urgency: WarrantyNotification["urgency"] = "low";
    let message = "";

    if (daysLeft < 0 && preferences.reminders.onExpiry) {
      shouldNotify = true;
      type = "expired";
      urgency = "low";
      message = `Warranty expired ${Math.abs(daysLeft)} days ago. You may still get support!`;
    } else if (daysLeft === 0 && preferences.reminders.onExpiry) {
      shouldNotify = true;
      type = "expiring_today";
      urgency = "critical";
      message = "Last day of warranty! File any claims TODAY!";
    } else if (daysLeft === 1 && preferences.reminders.days1) {
      shouldNotify = true;
      type = "1_day";
      urgency = "critical";
      message = "Warranty expires TOMORROW! Act now!";
    } else if (daysLeft >= 2 && daysLeft <= 7 && preferences.reminders.days7) {
      shouldNotify = true;
      type = "7_days";
      urgency = "high";
      message = `Warranty expires in ${daysLeft} days. Review coverage now.`;
    } else if (daysLeft >= 8 && daysLeft <= 14 && preferences.reminders.days14) {
      shouldNotify = true;
      type = "14_days";
      urgency = "medium";
      message = `Warranty expires in ${daysLeft} days. Plan ahead.`;
    } else if (daysLeft >= 15 && daysLeft <= 30 && preferences.reminders.days30) {
      shouldNotify = true;
      type = "30_days";
      urgency = "low";
      message = `Warranty expires in ${daysLeft} days.`;
    }

    if (shouldNotify && type) {
      const notification: WarrantyNotification = {
        id: `${warranty.id}_${type}_${Date.now()}`,
        warrantyId: warranty.id,
        productName: warranty.product_name,
        brand: warranty.brand,
        type,
        daysLeft,
        expiryDate: warranty.warranty_end_date,
        message,
        urgency,
        read: false,
        createdAt: new Date().toISOString(),
      };

      // Check if we already have this notification
      const existing = getNotifications().find(
        (n) =>
          n.warrantyId === warranty.id &&
          n.type === type &&
          !n.read &&
          differenceInDays(new Date(), new Date(n.createdAt)) < 1
      );

      if (!existing) {
        newNotifications.push(notification);
        addNotification(notification);

        // Send browser notification if enabled
        if (preferences.push) {
          const icon = urgency === "critical" ? "🚨" : urgency === "high" ? "⚠️" : "🔔";
          const title = `${icon} ${warranty.product_name}`;
          const body = message;

          sendBrowserNotification(title, {
            body,
            tag: notification.id,
            requireInteraction: urgency === "critical",
          });
        }
      }
    }
  });

  return newNotifications;
};

// Format notification message with details
export const formatNotificationMessage = (
  notification: WarrantyNotification
): string => {
  const productName = notification.brand
    ? `${notification.brand} ${notification.productName}`
    : notification.productName;

  const expiryFormatted = format(new Date(notification.expiryDate), "MMM d, yyyy");

  return `${productName}\nExpires: ${expiryFormatted}\n${notification.message}`;
};

