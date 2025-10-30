import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Shield, LogOut, Settings as SettingsIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { AddWarrantyDialog } from "@/components/AddWarrantyDialog";
import { WarrantiesList } from "@/components/WarrantiesList";
import { EmergencyButton } from "@/components/EmergencyButton";
import { NotificationCenter } from "@/components/NotificationCenter";
import { NotificationSettings } from "@/components/NotificationSettings";
import { ClaimTracker } from "@/components/ClaimTracker";
import { ValueDashboard } from "@/components/ValueDashboard";
import { RecentActivity } from "@/components/RecentActivity";
import { WarrantyTimeline } from "@/components/WarrantyTimeline";
import { KeyboardShortcutsDialog } from "@/components/KeyboardShortcutsDialog";
import { SmartInsights } from "@/components/SmartInsights";
import { DashboardLoadingSkeleton } from "@/components/LoadingSkeleton";
import { UsageWidget } from "@/components/UsageWidget";
import { useNotifications } from "@/hooks/useNotifications";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { differenceInDays } from "date-fns";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [addWarrantyDialogOpen, setAddWarrantyDialogOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const [notificationCenterOpen, setNotificationCenterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Initialize notification system
  useNotifications();

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: "n",
      ctrlKey: true,
      action: () => setAddWarrantyDialogOpen(true),
      description: "Add new warranty",
    },
    {
      key: "/",
      action: () => {
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      },
      description: "Focus search",
    },
    {
      key: "e",
      shiftKey: true,
      action: () => setEmergencyModalOpen(true),
      description: "Open emergency mode",
    },
    {
      key: "?",
      action: () => setShortcutsDialogOpen(true),
      description: "Show keyboard shortcuts",
    },
  ]);

  // Fetch warranties to calculate stats
  const { data: warranties } = useQuery({
    queryKey: ["warranties"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate warranty stats
  const warrantyStats = {
    active: warranties?.filter((w) => {
      const daysUntilExpiry = differenceInDays(new Date(w.warranty_end_date), new Date());
      return daysUntilExpiry > 30;
    }).length || 0,
    expiringSoon: warranties?.filter((w) => {
      const daysUntilExpiry = differenceInDays(new Date(w.warranty_end_date), new Date());
      return daysUntilExpiry >= 0 && daysUntilExpiry <= 30;
    }).length || 0,
    expired: warranties?.filter((w) => {
      const daysUntilExpiry = differenceInDays(new Date(w.warranty_end_date), new Date());
      return daysUntilExpiry < 0;
    }).length || 0,
  };

  useEffect(() => {
    // Check authentication status
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      toast.success("Signed out successfully");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-primary rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                Warranty Tracker
              </h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <DashboardLoadingSkeleton />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Logo & Title */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 sm:p-2 bg-gradient-primary rounded-lg shrink-0">
                <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-2xl font-bold bg-gradient-hero bg-clip-text text-transparent truncate">
                Warranty Tracker
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <NotificationCenter />
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate("/settings")}
                className="h-9 w-9 sm:h-10 sm:w-10"
              >
                <SettingsIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="outline" 
                onClick={handleSignOut}
                className="hidden sm:flex"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={handleSignOut}
                className="sm:hidden h-9 w-9"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 max-w-7xl">
        {/* Mobile: Compact header - Desktop: Full welcome */}
        <div className="flex items-center justify-between gap-3 mb-4 sm:hidden">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold truncate">
              Hi, {user?.user_metadata?.name?.split(' ')[0] || "User"}! 👋
            </h2>
          </div>
          <EmergencyButton />
        </div>

        <div className="hidden sm:flex sm:flex-row sm:items-start justify-between gap-4 mb-8">
          <div className="flex-1">
            <h2 className="text-3xl font-bold mb-2">
              Welcome back, {user?.user_metadata?.name || "User"}!
            </h2>
            <p className="text-base text-muted-foreground">
              Manage your warranties and never miss an expiration date.
            </p>
          </div>
          <div className="shrink-0">
            <EmergencyButton />
          </div>
        </div>

        {/* Stats Cards - WARRANTY FOCUSED & CLICKABLE */}
        <div className="grid gap-3 sm:gap-4 grid-cols-3 mb-4 sm:mb-6">
          <Card 
            className={`border-success/20 bg-success/5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${statusFilter === 'active' ? 'ring-2 ring-success shadow-lg' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'active' ? 'all' : 'active')}
          >
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-success text-xs sm:text-base">Active</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs hidden sm:block">Protected</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3 sm:px-6 sm:pb-6">
              <p className="text-2xl sm:text-4xl font-bold">{warrantyStats.active}</p>
            </CardContent>
          </Card>

          <Card 
            className={`border-warning/20 bg-warning/5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${statusFilter === 'expiring' ? 'ring-2 ring-warning shadow-lg' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'expiring' ? 'all' : 'expiring')}
          >
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-warning text-xs sm:text-base">Expiring</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs hidden sm:block">Soon</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3 sm:px-6 sm:pb-6">
              <p className="text-2xl sm:text-4xl font-bold">{warrantyStats.expiringSoon}</p>
            </CardContent>
          </Card>

          <Card 
            className={`border-danger/20 bg-danger/5 hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-pointer ${statusFilter === 'expired' ? 'ring-2 ring-danger shadow-lg' : ''}`}
            onClick={() => setStatusFilter(statusFilter === 'expired' ? 'all' : 'expired')}
          >
            <CardHeader className="pb-2 px-3 pt-3 sm:px-6 sm:pt-6">
              <CardTitle className="text-danger text-xs sm:text-base">Expired</CardTitle>
              <CardDescription className="text-[10px] sm:text-xs hidden sm:block">Past due</CardDescription>
            </CardHeader>
            <CardContent className="pt-0 px-3 pb-3 sm:px-6 sm:pb-6">
              <p className="text-2xl sm:text-4xl font-bold">{warrantyStats.expired}</p>
            </CardContent>
          </Card>
        </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3" id="urgent-warranties">
        {/* Warranties List */}
        <div className="lg:col-span-2">
          {/* Mobile: No card wrapper, just content */}
          <div className="sm:hidden mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Warranties</h3>
            <AddWarrantyDialog />
          </div>
          <div className="sm:hidden">
            <WarrantiesList initialStatusFilter={statusFilter} />
          </div>

          {/* Desktop: Card with header */}
          <Card className="hidden sm:block h-full">
            <CardHeader className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4">
              <div className="min-w-0 flex-1">
                <CardTitle className="text-xl sm:text-2xl mb-1">Your Warranties</CardTitle>
                <CardDescription className="text-sm">
                  Manage and track all your product warranties
                </CardDescription>
              </div>
              <div className="shrink-0">
                <AddWarrantyDialog />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <WarrantiesList initialStatusFilter={statusFilter} />
            </CardContent>
          </Card>
        </div>

          {/* Sidebar Widgets - Hidden on mobile */}
          <div className="hidden lg:block space-y-4 sm:space-y-6">
            <UsageWidget />
            <WarrantyTimeline />
            <ClaimTracker />
            <RecentActivity />
          </div>
        </div>

        {/* Smart Insights - Hidden on mobile */}
        <div className="mt-6 sm:mt-8 hidden sm:block">
          <SmartInsights />
        </div>

        {/* Value Dashboard - Desktop only */}
        <div className="mt-6 sm:mt-8 hidden lg:block">
          <ValueDashboard />
        </div>
      </main>

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
      />
    </div>
  );
};

export default Dashboard;
