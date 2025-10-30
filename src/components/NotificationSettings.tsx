import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Bell, Mail, Smartphone } from "lucide-react";
import {
  getNotificationPreferences,
  saveNotificationPreferences,
  requestNotificationPermission,
  type NotificationPreferences,
} from "@/lib/notifications";
import { toast } from "sonner";

export const NotificationSettings = () => {
  const [open, setOpen] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    getNotificationPreferences()
  );
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );

  useEffect(() => {
    if (open) {
      setPreferences(getNotificationPreferences());
      if (typeof Notification !== "undefined") {
        setBrowserPermission(Notification.permission);
      }
    }
  }, [open]);

  const handleSave = () => {
    saveNotificationPreferences(preferences);
    toast.success("Notification preferences saved!");
    setOpen(false);
  };

  const handleEnablePush = async () => {
    if (browserPermission === "granted") {
      setPreferences({ ...preferences, push: !preferences.push });
    } else {
      const granted = await requestNotificationPermission();
      if (granted) {
        setBrowserPermission("granted");
        setPreferences({ ...preferences, push: true });
        toast.success("Browser notifications enabled!");
      } else {
        toast.error("Browser notifications blocked. Check your browser settings.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Notification Settings</DialogTitle>
          <DialogDescription>
            Customize how and when you receive warranty reminders
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Master Toggle */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Label>
              <p className="text-sm text-muted-foreground">
                Receive warranty expiration reminders
              </p>
            </div>
            <Switch
              checked={preferences.enabled}
              onCheckedChange={(checked) =>
                setPreferences({ ...preferences, enabled: checked })
              }
            />
          </div>

          {preferences.enabled && (
            <>
              {/* Notification Channels */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-sm">Notification Channels</h4>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm flex items-center gap-2">
                      <Smartphone className="h-3 w-3" />
                      Browser Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Get instant alerts in your browser
                    </p>
                  </div>
                  <Switch
                    checked={preferences.push && browserPermission === "granted"}
                    onCheckedChange={handleEnablePush}
                    disabled={browserPermission === "denied"}
                  />
                </div>

                {browserPermission === "denied" && (
                  <p className="text-xs text-danger">
                    Browser notifications are blocked. Enable them in your browser settings.
                  </p>
                )}

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 flex-1">
                    <Label className="text-sm flex items-center gap-2">
                      <Mail className="h-3 w-3" />
                      Email Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive reminders via email (coming soon)
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email}
                    onCheckedChange={(checked) =>
                      setPreferences({ ...preferences, email: checked })
                    }
                    disabled
                  />
                </div>
              </div>

              {/* Reminder Timeline */}
              <div className="space-y-4 pt-4 border-t">
                <h4 className="font-semibold text-sm">Reminder Timeline</h4>
                <p className="text-xs text-muted-foreground">
                  Choose when to receive notifications before warranty expiration
                </p>

                <div className="space-y-3">
                  {/* 30 Days */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">30 Days Before</Label>
                      <p className="text-xs text-muted-foreground">
                        Early warning for planning
                      </p>
                    </div>
                    <Switch
                      checked={preferences.reminders.days30}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, days30: checked },
                        })
                      }
                    />
                  </div>

                  {/* 14 Days */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">14 Days Before</Label>
                      <p className="text-xs text-muted-foreground">
                        Two weeks notice
                      </p>
                    </div>
                    <Switch
                      checked={preferences.reminders.days14}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, days14: checked },
                        })
                      }
                    />
                  </div>

                  {/* 7 Days */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-warning">
                        7 Days Before ⚠️
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Urgent reminder - one week left
                      </p>
                    </div>
                    <Switch
                      checked={preferences.reminders.days7}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, days7: checked },
                        })
                      }
                    />
                  </div>

                  {/* 1 Day */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-danger">
                        1 Day Before 🚨
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Critical - last chance!
                      </p>
                    </div>
                    <Switch
                      checked={preferences.reminders.days1}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, days1: checked },
                        })
                      }
                    />
                  </div>

                  {/* On Expiry */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-semibold text-danger">
                        On Expiration Day 💥
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Final notification
                      </p>
                    </div>
                    <Switch
                      checked={preferences.reminders.onExpiry}
                      onCheckedChange={(checked) =>
                        setPreferences({
                          ...preferences,
                          reminders: { ...preferences.reminders, onExpiry: checked },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex gap-2 pt-4">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              Save Preferences
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

