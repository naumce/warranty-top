import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  MapPin, 
  FileText, 
  Scale, 
  MessageCircle,
  Loader2,
  Copy,
  Download,
  Phone,
  Mail,
  ExternalLink,
  AlertCircle,
  Sparkles
} from "lucide-react";
import { 
  findNearestServiceCenter, 
  generateClaimLetter, 
  getLegalAdvice, 
  chatWithAI 
} from "@/lib/ai-support";
import { useUserLimits } from "@/hooks/useUserLimits";

interface Warranty {
  id: string;
  product_name: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  warranty_end_date?: string;
  store_name?: string;
  store_address?: string;
  store_city?: string;
  store_phone?: string;
  purchase_price?: number;
  notes?: string;
}

export default function AISupport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { limits, tierDisplayName, canUseAISupport, incrementAISupport, isFree } = useUserLimits();
  const [warranty, setWarranty] = useState<Warranty | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("locator");
  const [accessDenied, setAccessDenied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  // Store Locator
  const [locatorLoading, setLocatorLoading] = useState(false);
  const [serviceCenters, setServiceCenters] = useState<any[]>([]);
  const [userCity, setUserCity] = useState("");
  const [showCityInput, setShowCityInput] = useState(false);
  
  // Claim Letter
  const [claimLoading, setClaimLoading] = useState(false);
  const [issueDescription, setIssueDescription] = useState("");
  const [desiredResolution, setDesiredResolution] = useState("Repair or replacement under warranty");
  const [claimLetter, setClaimLetter] = useState<any>(null);
  
  // Legal Advisor
  const [legalLoading, setLegalLoading] = useState(false);
  const [situation, setSituation] = useState("");
  const [legalAdvice, setLegalAdvice] = useState<any>(null);
  
  // Support Chat
  const [chatLoading, setChatLoading] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchWarranty();
    }
  }, [id]);

  // Page load animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Check premium access on mount and when limits change
  useEffect(() => {
    if (limits && isFree) {
      setAccessDenied(true);
      toast.error("AI Support is a premium feature", {
        description: "Upgrade to BASIC or higher to access AI-powered support tools"
      });
    }
  }, [limits, isFree]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const fetchWarranty = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("warranties")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) {
        toast.error("Warranty not found");
        navigate("/dashboard");
        return;
      }

      setWarranty(data);
    } catch (error) {
      console.error("Error fetching warranty:", error);
      toast.error("Failed to load warranty");
    } finally {
      setLoading(false);
    }
  };

  const handleFindServiceCenters = async () => {
    if (!warranty) return;

    // Check if we have location data
    const city = userCity || warranty.store_city;
    if (!city) {
      setShowCityInput(true);
      toast.info("Location needed", {
        description: "Please enter your city to find service centers"
      });
      return;
    }

    // Check AI Support limits
    const aiCheck = canUseAISupport();
    if (!aiCheck.allowed) {
      toast.error(aiCheck.reason, {
        description: "Upgrade to get more AI Support requests"
      });
      return;
    }

    setLocatorLoading(true);
    setShowCityInput(false);
    
    try {
      // Build search context with real data
      const searchContext = {
        productName: warranty.product_name,
        brand: warranty.brand || '',
        storeName: warranty.store_name || '',
        city: city,
        storeAddress: warranty.store_address || ''
      };

      // Use AI to find service centers with real context
      const centers = await findNearestServiceCenter(warranty, undefined);
      
      // If no centers found, provide helpful fallback
      if (centers.length === 0) {
        // Create fallback with store contact info
        const fallbackCenters = [];
        
        if (warranty.store_name) {
          // Build specific store search query
          const storeSearchQuery = warranty.store_address 
            ? `${warranty.store_name} ${warranty.store_address}` 
            : `${warranty.store_name} ${city}`;
          
          fallbackCenters.push({
            name: `${warranty.store_name} - Original Purchase Location`,
            address: warranty.store_address || `${city}`,
            phone: warranty.store_phone || "Contact store for phone",
            distance: "Original store",
            rating: null,
            hours: "Contact store for hours",
            isFallback: true,
            // Use specific store search, not just city
            mapsSearchQuery: storeSearchQuery
          });
        }
        
        // Add generic brand service center suggestion
        if (warranty.brand) {
          fallbackCenters.push({
            name: `${warranty.brand} Authorized Service Center`,
            address: `Search online for: "${warranty.brand} service center ${city}"`,
            phone: `Call ${warranty.brand} customer service`,
            distance: "Search required",
            rating: null,
            hours: "Varies by location",
            isFallback: true,
            searchUrl: `https://www.google.com/search?q=${encodeURIComponent(`${warranty.brand} authorized service center ${city}`)}`
          });
        }
        
        setServiceCenters(fallbackCenters);
        
        toast.info("Service center information", {
          description: "We've provided contact details and search suggestions"
        });
      } else {
        setServiceCenters(centers);
        toast.success(`Found ${centers.length} service center(s)`);
      }
      
      // Track usage
      incrementAISupport();
      
    } catch (error) {
      console.error("Store locator error:", error);
      toast.error("Failed to find service centers");
    } finally {
      setLocatorLoading(false);
    }
  };

  const handleGenerateClaimLetter = async () => {
    if (!warranty || !issueDescription || !desiredResolution) {
      toast.error("Please fill in all fields");
      return;
    }

    // Check AI Support limits
    const aiCheck = canUseAISupport();
    if (!aiCheck.allowed) {
      toast.error(aiCheck.reason, {
        description: "Upgrade to get more AI Support requests"
      });
      return;
    }

    setClaimLoading(true);
    try {
      const letter = await generateClaimLetter(warranty, issueDescription, desiredResolution);
      setClaimLetter(letter);
      
      // Track usage
      incrementAISupport();
      
      toast.success("Claim letter generated!");
    } catch (error) {
      console.error("Claim letter error:", error);
      toast.error("Failed to generate claim letter");
    } finally {
      setClaimLoading(false);
    }
  };

  const handleGetLegalAdvice = async () => {
    if (!warranty || !situation) {
      toast.error("Please describe your situation");
      return;
    }

    // Check AI Support limits
    const aiCheck = canUseAISupport();
    if (!aiCheck.allowed) {
      toast.error(aiCheck.reason, {
        description: "Upgrade to get more AI Support requests"
      });
      return;
    }

    setLegalLoading(true);
    try {
      const advice = await getLegalAdvice(warranty, situation);
      setLegalAdvice(advice);
      
      // Track usage
      incrementAISupport();
      
      toast.success("Legal advice generated!");
    } catch (error) {
      console.error("Legal advice error:", error);
      toast.error("Failed to get legal advice");
    } finally {
      setLegalLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!warranty || !chatMessage.trim()) return;

    // Check AI Support limits
    const aiCheck = canUseAISupport();
    if (!aiCheck.allowed) {
      toast.error(aiCheck.reason, {
        description: "Upgrade to get more AI Support requests"
      });
      return;
    }

    const userMessage = chatMessage.trim();
    setChatMessage("");
    setChatLoading(true);

    // Add user message to history
    const newHistory = [...chatHistory, { role: 'user' as const, content: userMessage }];
    setChatHistory(newHistory);

    try {
      const response = await chatWithAI(warranty, userMessage, chatHistory);
      setChatHistory([...newHistory, { role: 'assistant' as const, content: response }]);
      
      // Track usage
      incrementAISupport();
    } catch (error) {
      console.error("Chat error:", error);
      toast.error("Failed to get response");
      // Remove user message if failed
      setChatHistory(chatHistory);
    } finally {
      setChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!warranty) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Warranty Not Found</h2>
          <Button onClick={() => navigate("/dashboard")}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  // Premium gate - show upgrade prompt for free users
  if (accessDenied && isFree) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background">
        <header className="border-b bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate(`/warranty/${id}`)}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">AI Support Hub</h1>
                <p className="text-sm text-muted-foreground">Premium Feature</p>
              </div>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-12 max-w-4xl">
          <Card className="border-primary">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto mb-4 p-4 bg-gradient-primary rounded-full w-20 h-20 flex items-center justify-center">
                <Sparkles className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl mb-2">AI Support is Premium Only</CardTitle>
              <CardDescription className="text-base">
                Unlock powerful AI-powered tools to help with warranty claims, legal advice, and support
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Features List */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <MapPin className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">AI Store Locator</h4>
                    <p className="text-sm text-muted-foreground">Find nearest service centers instantly</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <FileText className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Claim Letter Generator</h4>
                    <p className="text-sm text-muted-foreground">Professional warranty claim letters</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <Scale className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Legal Advisor</h4>
                    <p className="text-sm text-muted-foreground">Know your consumer rights</p>
                  </div>
                </div>
                <div className="flex gap-3 p-4 bg-muted rounded-lg">
                  <MessageCircle className="h-6 w-6 text-primary shrink-0" />
                  <div>
                    <h4 className="font-semibold mb-1">Support Chat</h4>
                    <p className="text-sm text-muted-foreground">Real-time AI assistance</p>
                  </div>
                </div>
              </div>

              {/* Pricing Tiers */}
              <div className="border-t pt-6">
                <h3 className="font-semibold text-lg mb-4 text-center">Choose Your Plan</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">BASIC</CardTitle>
                      <div className="text-3xl font-bold">$4.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ 20 AI Support requests/month</li>
                        <li>✅ 20 warranties</li>
                        <li>✅ 100MB storage</li>
                      </ul>
                      <Button className="w-full mt-4 bg-gradient-primary" onClick={() => navigate("/upgrade")}>
                        Upgrade to BASIC
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-primary ring-2 ring-primary">
                    <CardHeader>
                      <Badge className="w-fit mb-2 bg-gradient-primary">Most Popular</Badge>
                      <CardTitle className="text-lg">PRO</CardTitle>
                      <div className="text-3xl font-bold">$9.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ 100 AI Support requests/month</li>
                        <li>✅ 100 warranties</li>
                        <li>✅ 500MB storage</li>
                      </ul>
                      <Button className="w-full mt-4 bg-gradient-primary" onClick={() => navigate("/upgrade")}>
                        Upgrade to PRO
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-primary">
                    <CardHeader>
                      <CardTitle className="text-lg">ULTIMATE</CardTitle>
                      <div className="text-3xl font-bold">$19.99<span className="text-sm font-normal text-muted-foreground">/mo</span></div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm">
                        <li>✅ Unlimited AI Support</li>
                        <li>✅ Unlimited warranties</li>
                        <li>✅ 2GB storage</li>
                      </ul>
                      <Button className="w-full mt-4 bg-gradient-primary" onClick={() => navigate("/upgrade")}>
                        Upgrade to ULTIMATE
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Back Button */}
              <div className="text-center pt-4">
                <Button variant="outline" onClick={() => navigate(`/warranty/${id}`)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Warranty
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className={`
      min-h-screen bg-gradient-to-br from-background via-accent to-background
      transition-all duration-700 ease-out
      ${isVisible ? 'opacity-100' : 'opacity-0'}
    `}>
      {/* Header - Compact Mobile Design */}
      <header className="border-b bg-card/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-3 py-2 sm:px-4 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/warranty/${id}`)}
              className="h-10 w-10 sm:h-11 sm:w-11 shrink-0 active:scale-95 transition-transform duration-150"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            
            {/* Title - Compact on mobile */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <h1 className="text-sm sm:text-xl font-bold truncate">AI Support</h1>
                <Badge className="bg-gradient-primary text-white text-[10px] sm:text-xs px-1.5 sm:px-2 py-0 sm:py-0.5 h-5 sm:h-auto">
                  {tierDisplayName}
                </Badge>
              </div>
              <p className="text-[11px] sm:text-sm text-muted-foreground truncate leading-tight">
                {warranty.product_name}
              </p>
            </div>

            {/* Usage indicator - Desktop only */}
            {limits && (
              <Badge variant="outline" className="hidden md:flex text-xs shrink-0">
                {limits.ai_support_requests_used}/{limits.max_ai_support_requests_per_month === 999999 ? '∞' : limits.max_ai_support_requests_per_month}
              </Badge>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Warranty Info Card */}
        <Card className="mb-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{warranty.product_name}</h3>
                {warranty.brand && <p className="text-sm text-muted-foreground">Brand: {warranty.brand}</p>}
                {warranty.model && <p className="text-sm text-muted-foreground">Model: {warranty.model}</p>}
                {warranty.serial_number && <p className="text-sm text-muted-foreground font-mono">Serial: {warranty.serial_number}</p>}
              </div>
              <div className="space-y-1">
                {warranty.purchase_date && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Purchased:</span> <span className="font-medium">{new Date(warranty.purchase_date).toLocaleDateString()}</span>
                  </p>
                )}
                {warranty.warranty_end_date && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Expires:</span> <span className="font-medium">{new Date(warranty.warranty_end_date).toLocaleDateString()}</span>
                  </p>
                )}
                {warranty.store_name && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Store:</span> <span className="font-medium">{warranty.store_name}</span>
                  </p>
                )}
                {warranty.purchase_price && (
                  <p className="text-sm">
                    <span className="text-muted-foreground">Value:</span> <span className="font-medium">${warranty.purchase_price.toFixed(2)}</span>
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 gap-1">
            <TabsTrigger 
              value="locator" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[56px] sm:min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MapPin className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-[10px] sm:text-sm font-medium leading-tight text-center">Store Locator</span>
            </TabsTrigger>
            <TabsTrigger 
              value="claim" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[56px] sm:min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <FileText className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-[10px] sm:text-sm font-medium leading-tight text-center">Claim Letter</span>
            </TabsTrigger>
            <TabsTrigger 
              value="legal" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[56px] sm:min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <Scale className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-[10px] sm:text-sm font-medium leading-tight text-center">Legal Advisor</span>
            </TabsTrigger>
            <TabsTrigger 
              value="chat" 
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 min-h-[56px] sm:min-h-[44px] px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <MessageCircle className="h-5 w-5 sm:h-4 sm:w-4 shrink-0" />
              <span className="text-[10px] sm:text-sm font-medium leading-tight text-center">Support Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* 1. Store Locator */}
          <TabsContent value="locator" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  AI Store Locator
                </CardTitle>
                <CardDescription>
                  Find nearest authorized service centers for your product
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Location Info */}
                {warranty.store_city ? (
                  <div className="bg-muted p-3 rounded-lg text-sm">
                    <p className="text-muted-foreground">
                      📍 Searching near: <span className="font-medium text-foreground">{warranty.store_city}</span>
                    </p>
                    {warranty.store_name && (
                      <p className="text-muted-foreground mt-1">
                        🏪 Original store: <span className="font-medium text-foreground">{warranty.store_name}</span>
                      </p>
                    )}
                  </div>
                ) : showCityInput && (
                  <div className="space-y-2">
                    <Label htmlFor="userCity">Enter Your City *</Label>
                    <div className="flex gap-2">
                      <Input
                        id="userCity"
                        placeholder="e.g., New York, Los Angeles, Chicago..."
                        value={userCity}
                        onChange={(e) => setUserCity(e.target.value)}
                      />
                      <Button 
                        onClick={() => {
                          if (userCity.trim()) {
                            handleFindServiceCenters();
                          } else {
                            toast.error("Please enter a city");
                          }
                        }}
                        disabled={!userCity.trim()}
                      >
                        Search
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      💡 We need your location to find nearby service centers
                    </p>
                  </div>
                )}

                {!showCityInput && (
                  <Button 
                    onClick={handleFindServiceCenters}
                    disabled={locatorLoading}
                    className="w-full bg-gradient-primary"
                  >
                    {locatorLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <MapPin className="h-4 w-4 mr-2" />
                        Find Service Centers
                      </>
                    )}
                  </Button>
                )}

                {serviceCenters.length > 0 && (
                  <div className="space-y-3">
                    {serviceCenters.map((center, index) => (
                      <Card key={index} className={center.isFallback ? "border-orange-500/50 bg-orange-50/50 dark:bg-orange-900/10" : ""}>
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{center.name}</h4>
                                {center.isFallback && (
                                  <Badge variant="outline" className="text-xs">
                                    Suggestion
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{center.address}</p>
                              {center.hours && (
                                <p className="text-sm text-muted-foreground">{center.hours}</p>
                              )}
                              {center.rating && (
                                <Badge variant="secondary" className="mt-2">
                                  ⭐ {center.rating}
                                </Badge>
                              )}
                            </div>
                            {center.distance && (
                              <Badge>{center.distance}</Badge>
                            )}
                          </div>
                          <div className="flex gap-2 mt-4">
                            {center.phone && center.phone !== "Contact store for phone" && center.phone !== `Call ${warranty.brand} customer service` && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`tel:${center.phone}`)}
                                className="flex-1"
                              >
                                <Phone className="h-4 w-4 mr-2" />
                                Call
                              </Button>
                            )}
                            {center.searchUrl ? (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => window.open(center.searchUrl, '_blank')}
                                className="flex-1"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Search Online
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  // Use specific store search query if available, otherwise use address
                                  const searchQuery = center.mapsSearchQuery || center.address;
                                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`, '_blank');
                                }}
                                className="flex-1"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Directions
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Claim Letter Generator */}
          <TabsContent value="claim" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  AI Claim Letter Generator
                </CardTitle>
                <CardDescription>
                  Generate a professional warranty claim letter
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="issue">Describe the Issue *</Label>
                    <Textarea
                      id="issue"
                      placeholder={`e.g., My ${warranty.product_name} ${warranty.brand ? `(${warranty.brand})` : ''} stopped working properly. The issue started...`}
                      value={issueDescription}
                      onChange={(e) => setIssueDescription(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Tip: Be specific about when the issue started and what symptoms you're experiencing
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="resolution">Desired Resolution *</Label>
                    <Input
                      id="resolution"
                      placeholder="e.g., Full refund, Replacement, Repair"
                      value={desiredResolution}
                      onChange={(e) => setDesiredResolution(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Product: {warranty.product_name} {warranty.brand && `• Brand: ${warranty.brand}`} {warranty.purchase_price && `• Value: $${warranty.purchase_price}`}
                    </p>
                  </div>

                  <Button 
                    onClick={handleGenerateClaimLetter}
                    disabled={claimLoading || !issueDescription || !desiredResolution}
                    className="bg-gradient-primary"
                  >
                    {claimLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Letter
                      </>
                    )}
                  </Button>
                </div>

                {claimLetter && (
                  <Card className="border-primary">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{claimLetter.subject}</CardTitle>
                        <Badge>{claimLetter.confidence} confidence</Badge>
                      </div>
                      <CardDescription>To: {claimLetter.recipient}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap text-sm">
                        {claimLetter.body}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(claimLetter.body)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => window.open(`mailto:${warranty.store_name || ''}?subject=${encodeURIComponent(claimLetter.subject)}&body=${encodeURIComponent(claimLetter.body)}`)}
                          className="flex-1"
                        >
                          <Mail className="h-4 w-4 mr-2" />
                          Email
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Legal Advisor */}
          <TabsContent value="legal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scale className="h-5 w-5" />
                  AI Legal Advisor
                </CardTitle>
                <CardDescription>
                  Get guidance on your warranty rights and next steps
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="situation">Describe Your Situation *</Label>
                    <Textarea
                      id="situation"
                      placeholder={`e.g., I purchased a ${warranty.product_name} from ${warranty.store_name || 'the store'} and now they refuse to honor the warranty...`}
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      rows={4}
                    />
                    <p className="text-xs text-muted-foreground">
                      💡 Context: {warranty.product_name} {warranty.purchase_date && `• Purchased: ${new Date(warranty.purchase_date).toLocaleDateString()}`} {warranty.warranty_end_date && `• Expires: ${new Date(warranty.warranty_end_date).toLocaleDateString()}`}
                    </p>
                  </div>

                  <Button 
                    onClick={handleGetLegalAdvice}
                    disabled={legalLoading || !situation}
                    className="bg-gradient-primary"
                  >
                    {legalLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Scale className="h-4 w-4 mr-2" />
                        Get Legal Advice
                      </>
                    )}
                  </Button>
                </div>

                {legalAdvice && (
                  <div className="space-y-4">
                    <Card className="border-green-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Your Rights</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          {legalAdvice.rights.map((right: string, index: number) => (
                            <li key={index}>{right}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-blue-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Store Obligations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                          {legalAdvice.obligations.map((obligation: string, index: number) => (
                            <li key={index}>{obligation}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    <Card className="border-orange-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Next Steps</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          {legalAdvice.nextSteps.map((step: string, index: number) => (
                            <li key={index}>{step}</li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>

                    <Card className="border-red-500">
                      <CardHeader>
                        <CardTitle className="text-lg">Escalation Path</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ol className="list-decimal list-inside space-y-2 text-sm">
                          {legalAdvice.escalationPath.map((level: string, index: number) => (
                            <li key={index}>{level}</li>
                          ))}
                        </ol>
                      </CardContent>
                    </Card>

                    {legalAdvice.resources.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-lg">Resources</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {legalAdvice.resources.map((resource: any, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                <span className="text-sm font-medium">{resource.name}</span>
                                <div className="flex gap-2">
                                  {resource.phone && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(`tel:${resource.phone}`)}
                                    >
                                      <Phone className="h-4 w-4" />
                                    </Button>
                                  )}
                                  {resource.url && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => window.open(resource.url, '_blank')}
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        <strong>Disclaimer:</strong> This is general information, not legal advice. For specific legal matters, please consult a qualified attorney.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Support Chat */}
          <TabsContent value="chat" className="space-y-6">
            <Card className="h-[600px] flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  AI Support Chat
                </CardTitle>
                <CardDescription>
                  Ask questions about your warranty and get instant help
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                {/* Chat History */}
                <div className="flex-1 overflow-y-auto space-y-4 mb-4 p-4 bg-muted rounded-lg">
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Start a conversation with our AI assistant</p>
                      <p className="text-sm mt-2">Ask anything about your warranty!</p>
                    </div>
                  ) : (
                    chatHistory.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-card border'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-card border p-3 rounded-lg">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Ask a question..."
                    value={chatMessage}
                    onChange={(e) => setChatMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()}
                    disabled={chatLoading}
                  />
                  <Button
                    onClick={handleSendChatMessage}
                    disabled={chatLoading || !chatMessage.trim()}
                    className="bg-gradient-primary"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

