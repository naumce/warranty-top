import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, Clock, X, Phone, Mail, AlertCircle, CheckCircle } from "lucide-react";
import { 
  getNotifications, 
  getUnreadCount, 
  markNotificationRead, 
  snoozeNotification, 
  deleteNotification,
  clearAllNotifications,
  isSnoozed,
  type WarrantyNotification
} from "@/lib/notifications";
import { format } from "date-fns";
import { toast } from "sonner";

export const NotificationCenter = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<WarrantyNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = () => {
    const allNotifications = getNotifications();
    // Filter out snoozed notifications
    const activeNotifications = allNotifications.filter(n => !isSnoozed(n));
    setNotifications(activeNotifications);
    setUnreadCount(getUnreadCount());
  };

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every minute
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (open) {
      loadNotifications();
    }
  }, [open]);

  const handleMarkRead = (notificationId: string) => {
    markNotificationRead(notificationId);
    loadNotifications();
  };

  const handleSnooze = (notificationId: string, days: number) => {
    snoozeNotification(notificationId, days);
    loadNotifications();
    toast.success(`Reminder snoozed for ${days} day${days > 1 ? 's' : ''}`);
  };

  const handleDelete = (notificationId: string) => {
    deleteNotification(notificationId);
    loadNotifications();
    toast.success("Notification dismissed");
  };

  const handleClearAll = () => {
    clearAllNotifications();
    loadNotifications();
    toast.success("All notifications cleared");
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return "bg-danger text-white";
      case "high":
        return "bg-warning text-white";
      case "medium":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case "critical":
        return <AlertCircle className="h-4 w-4" />;
      case "high":
        return <AlertCircle className="h-4 w-4" />;
      case "medium":
        return <Bell className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-danger"
              variant="destructive"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Notifications</span>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                className="text-xs"
              >
                Clear All
              </Button>
            )}
          </SheetTitle>
          <SheetDescription>
            Warranty expiration reminders and alerts
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {notifications.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-16 w-16 mx-auto text-success mb-4" />
              <p className="text-lg font-semibold mb-2">All caught up!</p>
              <p className="text-sm text-muted-foreground">
                No warranty reminders at this time.
              </p>
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 sm:p-4 rounded-lg border ${
                  notification.read ? "border-gray-200 bg-gray-50" : "border-blue-300 bg-blue-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                    <Badge className={getUrgencyColor(notification.urgency)} variant="default">
                      {getUrgencyIcon(notification.urgency)}
                      <span className="ml-1 uppercase text-xs font-semibold">
                        {notification.urgency}
                      </span>
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(notification.createdAt), "MMM d, h:mm a")}
                    </span>
                  </div>
                  {!notification.read && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>

                <h4 className="font-semibold text-sm sm:text-base mb-1 break-words">
                  {notification.brand && `${notification.brand} `}
                  {notification.productName}
                </h4>

                <p className="text-xs sm:text-sm mb-1 break-words">
                  <strong>Expires:</strong> {format(new Date(notification.expiryDate), "MMM d, yyyy")}
                  {notification.daysLeft >= 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({notification.daysLeft} days left)
                    </span>
                  )}
                </p>

                <p className="text-xs sm:text-sm text-muted-foreground mb-3 break-words">
                  {notification.message}
                </p>

                <div className="flex flex-wrap gap-2">
                  {notification.urgency === "critical" || notification.urgency === "high" ? (
                    <>
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 sm:flex-none sm:min-w-[140px] h-8"
                        onClick={() => {
                          handleMarkRead(notification.id);
                          toast.info("Opening warranty details...");
                        }}
                      >
                        <Phone className="h-3 w-3 mr-1.5" />
                        <span className="text-xs">Contact</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 sm:flex-none sm:min-w-[100px] h-8"
                        onClick={() => {
                          handleMarkRead(notification.id);
                          toast.info("Reviewing warranty...");
                        }}
                      >
                        <Mail className="h-3 w-3 mr-1.5" />
                        <span className="text-xs">Review</span>
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8"
                      onClick={() => handleMarkRead(notification.id)}
                    >
                      <Check className="h-3 w-3 mr-1.5" />
                      <span className="text-xs">Mark Read</span>
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8"
                    onClick={() => handleSnooze(notification.id, 1)}
                  >
                    <Clock className="h-3 w-3 mr-1.5" />
                    <span className="text-xs">Snooze</span>
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 px-2"
                    onClick={() => handleDelete(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

