import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Camera, Bell, Users, TrendingUp, CheckCircle2, Zap, Search, FileText, Lightbulb, Keyboard, Download } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
      {/* Hero Section */}
      <header className="container mx-auto px-4 pt-20 pb-16">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <div className="mb-6 p-4 bg-gradient-primary rounded-2xl shadow-glow">
            <Shield className="h-16 w-16 text-white" />
          </div>
          <Badge variant="secondary" className="mb-4 text-sm px-4 py-1">
            🎉 New: AI-Powered Smart Insights & Emergency Mode
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Never Lose a Warranty Again
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl">
            Track warranties with AI-powered scanning, get smart reminders, file claims instantly, 
            and never miss an expiration date. All your warranties, one beautiful dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8">
              Learn More
            </Button>
          </div>
        </div>
      </header>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4">Everything You Need to Stay Protected</h2>
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          24 powerful features to help you manage, track, and never lose warranty coverage on your valuable items.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-primary/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-gradient-primary rounded-lg w-fit">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Smart Receipt Scanning</CardTitle>
              <CardDescription>
                Snap a photo of your receipt and let AI extract all the details automatically. No typing required.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-gradient-secondary rounded-lg w-fit">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Expiration Reminders</CardTitle>
              <CardDescription>
                Get notified 30, 14, and 7 days before your warranties expire. Never miss a claim again.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-success/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-success rounded-lg w-fit">
                <Users className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Family Sharing</CardTitle>
              <CardDescription>
                Share warranties with family members. Everyone stays informed about household items.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-warning/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-warning rounded-lg w-fit">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Value Tracking</CardTitle>
              <CardDescription>
                See the total value of your warranty coverage. Understand what you're protected for.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-primary/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-gradient-primary rounded-lg w-fit">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Status Dashboard</CardTitle>
              <CardDescription>
                Color-coded cards show active, expiring, and expired warranties at a glance.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-secondary/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-gradient-secondary rounded-lg w-fit">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Secure Storage</CardTitle>
              <CardDescription>
                Your receipts and warranty data are encrypted and stored securely in the cloud.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-danger/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-danger rounded-lg w-fit">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Emergency Mode</CardTitle>
              <CardDescription>
                Quick access to find warranties, contact support, and download documents when you need them most.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-purple-500/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-purple-500 rounded-lg w-fit">
                <Lightbulb className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Smart Insights</CardTitle>
              <CardDescription>
                AI analyzes your warranties and provides personalized recommendations and alerts.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-blue-500/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-blue-500 rounded-lg w-fit">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Claims Management</CardTitle>
              <CardDescription>
                File and track warranty claims with our easy step-by-step wizard and progress tracking.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-green-500/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-green-500 rounded-lg w-fit">
                <Search className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Advanced Search</CardTitle>
              <CardDescription>
                Filter by status, category, sort by value or expiry. Bulk actions and CSV export included.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-orange-500/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-orange-500 rounded-lg w-fit">
                <Keyboard className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Keyboard Shortcuts</CardTitle>
              <CardDescription>
                Power user? Navigate fast with shortcuts for adding, searching, and emergency access.
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-cyan-500/20 hover:shadow-glow transition-shadow">
            <CardHeader>
              <div className="mb-2 p-2 bg-cyan-500 rounded-lg w-fit">
                <Download className="h-6 w-6 text-white" />
              </div>
              <CardTitle>Export & PDF</CardTitle>
              <CardDescription>
                Download warranties as PDFs, export data to CSV, backup everything with one click.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16">
        <Card className="bg-gradient-hero border-0 text-white">
          <CardContent className="py-12 text-center">
            <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-lg mb-8 text-white/90">
              Join thousands of users who never worry about lost warranties anymore.
            </p>
            <Button 
              size="lg" 
              variant="secondary"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Create Free Account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t">
        <div className="text-center text-muted-foreground">
          <p>© 2025 Warranty Tracker. Never miss an expiration date again.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
