import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Shield, User, Bell, Database, Download, Trash2, ArrowLeft, LogOut, Crown, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { getNotificationPreferences, saveNotificationPreferences } from "@/lib/notifications";
import { useUserLimits } from "@/hooks/useUserLimits";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const Settings = () => {
  const navigate = useNavigate();
  const { limits, tierDisplayName, warrantyUsage, storageUsage, ocrUsage, warrantyUsagePercent, storageUsagePercent } = useUserLimits();
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
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/dashboard")}
              className="min-h-[44px] min-w-[44px]"
            >
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
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="min-h-[44px]"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Subscription & Billing */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5" />
                  Subscription & Billing
                </CardTitle>
                <Badge 
                  className={`${
                    limits?.tier === 'ultimate' ? 'bg-gradient-to-r from-purple-600 to-pink-600' :
                    limits?.tier === 'pro' ? 'bg-gradient-to-r from-blue-600 to-cyan-600' :
                    limits?.tier === 'basic' ? 'bg-gradient-to-r from-green-600 to-emerald-600' :
                    'bg-gradient-to-r from-gray-600 to-gray-700'
                  } text-white border-none`}
                >
                  {limits?.tier === 'ultimate' || limits?.tier === 'pro' ? (
                    <Crown className="h-3 w-3 mr-1" />
                  ) : null}
                  {tierDisplayName}
                </Badge>
              </div>
              <CardDescription>
                Manage your subscription and view usage limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Current Plan */}
              <div>
                <h3 className="font-medium mb-4">Current Plan</h3>
                <div className="grid gap-4">
                  {/* Warranties */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Warranties</span>
                      <span className="font-medium">{warrantyUsage}</span>
                    </div>
                    <Progress value={warrantyUsagePercent} className="h-2" />
                  </div>

                  {/* Storage */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Storage</span>
                      <span className="font-medium">{storageUsage}</span>
                    </div>
                    <Progress value={storageUsagePercent} className="h-2" />
                  </div>

                  {/* OCR Scans */}
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">OCR Scans (Monthly)</span>
                      <span className="font-medium">{ocrUsage}</span>
                    </div>
                  </div>

                  {/* Photos per warranty */}
                  <div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Photos per warranty</span>
                      <span className="font-medium">{limits?.max_photos_per_warranty || 2}</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Upgrade Button */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium">Want more features?</p>
                  <p className="text-sm text-muted-foreground">
                    Upgrade to unlock unlimited warranties, more storage, and AI features
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/upgrade")}
                  className="bg-gradient-primary w-full sm:w-auto min-h-[44px] active:scale-95 transition-transform duration-150"
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Upgrade
                </Button>
              </div>
            </CardContent>
          </Card>

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

              <Button 
                onClick={handleSaveProfile} 
                disabled={saving}
                className="w-full sm:w-auto min-h-[44px]"
              >
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
              <div className="flex items-center justify-between gap-4 min-h-[60px]">
                <div className="space-y-0.5 flex-1">
                  <Label className="text-base cursor-pointer">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive warranty expiration reminders
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.enabled}
                  onCheckedChange={(checked) =>
                    setNotificationSettings({ ...notificationSettings, enabled: checked })
                  }
                  className="shrink-0"
                />
              </div>

              {notificationSettings.enabled && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <h4 className="font-medium text-sm">Reminder Timeline</h4>
                    
                    <div className="flex items-center justify-between gap-4 min-h-[44px]">
                      <Label className="cursor-pointer flex-1">30 Days Before</Label>
                      <Switch
                        checked={notificationSettings.reminders.days30}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days30: checked },
                          })
                        }
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 min-h-[44px]">
                      <Label className="cursor-pointer flex-1">14 Days Before</Label>
                      <Switch
                        checked={notificationSettings.reminders.days14}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days14: checked },
                          })
                        }
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 min-h-[44px]">
                      <Label className="text-warning cursor-pointer flex-1">7 Days Before ⚠️</Label>
                      <Switch
                        checked={notificationSettings.reminders.days7}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days7: checked },
                          })
                        }
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 min-h-[44px]">
                      <Label className="text-danger cursor-pointer flex-1">1 Day Before 🚨</Label>
                      <Switch
                        checked={notificationSettings.reminders.days1}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, days1: checked },
                          })
                        }
                        className="shrink-0"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 min-h-[44px]">
                      <Label className="text-danger cursor-pointer flex-1">On Expiration Day 💥</Label>
                      <Switch
                        checked={notificationSettings.reminders.onExpiry}
                        onCheckedChange={(checked) =>
                          setNotificationSettings({
                            ...notificationSettings,
                            reminders: { ...notificationSettings.reminders, onExpiry: checked },
                          })
                        }
                        className="shrink-0"
                      />
                    </div>
                  </div>
                </>
              )}

              <Button 
                onClick={handleSaveNotifications}
                className="w-full sm:w-auto min-h-[44px]"
              >
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
                <Button 
                  variant="outline" 
                  onClick={handleExportData}
                  className="w-full sm:w-auto min-h-[44px]"
                >
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
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="w-full sm:w-auto min-h-[44px]"
                >
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

