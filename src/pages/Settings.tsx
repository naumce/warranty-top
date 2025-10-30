import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Bell, Database, Download, Trash2, ArrowLeft, LogOut } from "lucide-react";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { getNotificationPreferences, saveNotificationPreferences } from "@/lib/notifications";

const Settings = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [notificationSettings, setNotificationSettings] = useState(getNotificationPreferences());

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      setUser(user);
      setDisplayName(user.user_metadata?.name || user.email?.split("@")[0] || "");
    } catch (error) {
      console.error("Error checking user:", error);
      navigate("/login");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name: displayName }
      });

      if (error) throw error;
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = () => {
    saveNotificationPreferences(notificationSettings);
    toast.success("Notification preferences saved!");
  };

  const handleExportData = async () => {
    try {
      const { data: warranties, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user?.id);

      if (error) throw error;

      const dataStr = JSON.stringify(warranties, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `warranty-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will delete all your warranties."
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      "This is your final warning. Deleting your account will permanently erase all your data. Are you absolutely sure?"
    );

    if (!doubleConfirm) return;

    try {
      // Delete all warranties first
      const { error: warrantiesError } = await supabase
        .from("warranties")
        .delete()
        .eq("user_id", user?.id);

      if (warrantiesError) throw warrantiesError;

      // Note: Supabase doesn't allow deleting users from client side
      // This would need to be done via a backend function or manually
      toast.info("Please contact support to complete account deletion", {
        description: "Your warranties have been deleted. Contact support@example.com to delete your account.",
      });

      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
    toast.success("Signed out successfully");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Settings
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                />
              </div>

              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifications
              </CardTitle>
              <CardDescription>Control how you receive warranty reminders</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive warranty expiration reminders
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, enabled: checked })
                  }
                />
              </div>

              {notificationSettings.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Reminder Timeline</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label>30 Days Before</Label>
                      <Switch
                        checked={notificationSettings.reminders.days30}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days30: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label>14 Days Before</Label>
                      <Switch
                        checked={notificationSettings.reminders.days14}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days14: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-warning">7 Days Before ⚠️</Label>
                      <Switch
                        checked={notificationSettings.reminders.days7}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days7: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-danger">1 Day Before 🚨</Label>
                      <Switch
                        checked={notificationSettings.reminders.days1}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days1: checked },
                          })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-danger">On Expiration Day 💥</Label>
                      <Switch
                        checked={notificationSettings.reminders.onExpiry}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, onExpiry: checked },
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <Button onClick={handleSaveNotifications}>
                Save Notification Preferences
              </Button>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Management
              </CardTitle>
              <CardDescription>Export or delete your warranty data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Export Data</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Download all your warranty data as JSON
                </p>
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="h-4 w-4 mr-2" />
                  Export All Data
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-danger">Danger Zone</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Permanently delete your account and all data
                </p>
                <Button variant="destructive" onClick={handleDeleteAccount}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Account
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardContent className="pt-6 text-center text-sm text-muted-foreground">
              <p className="mb-2">Warranty Tracker v1.0.0</p>
              <p>© 2025 All rights reserved</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Settings;

