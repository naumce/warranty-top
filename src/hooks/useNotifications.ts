import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  checkWarrantiesForNotifications,
  getUnreadCount,
  getNotificationPreferences,
  type WarrantyNotification,
} from "@/lib/notifications";

export const useNotifications = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Fetch warranties
  const { data: warranties = [] } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id)
        .order("warranty_end_date", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });

  // Check warranties and create notifications
  const checkWarranties = () => {
    const preferences = getNotificationPreferences();
    if (!preferences.enabled) return;

    if (warranties.length > 0) {
      const newNotifications = checkWarrantiesForNotifications(warranties);
      
      if (newNotifications.length > 0) {
        console.log(`Created ${newNotifications.length} new notification(s)`);
      }
      
      setLastCheck(new Date());
    }

    // Update unread count
    setUnreadCount(getUnreadCount());
  };

  // Check warranties on mount and when warranties change
  useEffect(() => {
    checkWarranties();
  }, [warranties]);

  // Check periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      checkWarranties();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [warranties]);

  // Check when page becomes visible (user returns to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkWarranties();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [warranties]);

  return {
    unreadCount,
    lastCheck,
    checkWarranties,
  };
};

