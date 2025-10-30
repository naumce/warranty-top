import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Camera, Upload, FileText, Phone, Mail, CheckCircle, AlertCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ClaimWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warranty: {
    id: string;
    product_name: string;
    brand?: string;
    model?: string;
    serial_number?: string;
    purchase_date: string;
    warranty_end_date: string;
    store_name?: string;
    purchase_price?: number;
  };
}

const ISSUE_TYPES = [
  "Defect/Malfunction",
  "Physical Damage",
  "Performance Issues",
  "Not Working",
  "Missing Parts",
  "Software Issues",
  "Other",
];

const DESIRED_RESOLUTIONS = [
  "Repair",
  "Replacement",
  "Refund",
  "Store Credit",
  "Not Sure",
];

const CONTACT_METHODS = [
  "Email",
  "Phone",
  "Text Message",
];

export const ClaimWizard = ({ open, onOpenChange, warranty }: ClaimWizardProps) => {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [claimId, setClaimId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    // Step 1: Issue Details
    issue_type: "",
    issue_description: "",
    issue_date: format(new Date(), "yyyy-MM-dd"),
    troubleshooting_attempted: "",
    desired_resolution: "",
    
    // Step 2: Photos/Videos
    attachments: [] as File[],
    
    // Step 3: Contact Info
    contact_email: "",
    contact_phone: "",
    preferred_contact_method: "Email",
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.issue_type) {
          toast.error("Please select an issue type");
          return false;
        }
        if (!formData.issue_description || formData.issue_description.length < 10) {
          toast.error("Please provide a detailed issue description (at least 10 characters)");
          return false;
        }
        return true;
      case 2:
        // Photos optional
        return true;
      case 3:
        if (!formData.contact_email && !formData.contact_phone) {
          toast.error("Please provide at least one contact method");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + formData.attachments.length > 10) {
      toast.error("Maximum 10 files allowed");
      return;
    }
    setFormData({ ...formData, attachments: [...formData.attachments, ...files] });
  };

  const removeAttachment = (index: number) => {
    const newAttachments = formData.attachments.filter((_, i) => i !== index);
    setFormData({ ...formData, attachments: newAttachments });
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      // Create claim
      const { data: claim, error: claimError } = await supabase
        .from("warranty_claims")
        .insert({
          user_id: user.id,
          warranty_id: warranty.id,
          issue_type: formData.issue_type,
          issue_description: formData.issue_description,
          issue_date: formData.issue_date,
          troubleshooting_attempted: formData.troubleshooting_attempted,
          desired_resolution: formData.desired_resolution,
          contact_email: formData.contact_email,
          contact_phone: formData.contact_phone,
          preferred_contact_method: formData.preferred_contact_method,
          claim_status: "draft",
        })
        .select()
        .single();

      if (claimError) throw claimError;

      setClaimId(claim.id);

      // Upload attachments if any
      if (formData.attachments.length > 0) {
        for (const file of formData.attachments) {
          const fileExt = file.name.split(".").pop();
          const fileName = `${claim.id}/${Date.now()}.${fileExt}`;
          
          const { error: uploadError } = await supabase.storage
            .from("warranty-documents")
            .upload(fileName, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from("warranty-documents")
              .getPublicUrl(fileName);

            // Save attachment record
            await supabase.from("warranty_claim_attachments").insert({
              claim_id: claim.id,
              user_id: user.id,
              file_name: file.name,
              file_type: file.type,
              file_size: file.size,
              storage_path: fileName,
              url: publicUrl,
              attachment_type: file.type.startsWith("video") ? "issue_video" : "issue_photo",
            });
          }
        }
      }

      setStep(4);
      toast.success("Claim created successfully!");
    } catch (error) {
      console.error("Claim submission error:", error);
      toast.error("Failed to create claim");
    } finally {
      setSubmitting(false);
    }
  };

  const generateSupportEmail = () => {
    const subject = encodeURIComponent(`Warranty Claim: ${warranty.brand || ""} ${warranty.product_name}`);
    const body = encodeURIComponent(`
Dear Support Team,

I am filing a warranty claim for the following product:

Product: ${warranty.brand || ""} ${warranty.product_name}
Model: ${warranty.model || "N/A"}
Serial Number: ${warranty.serial_number || "N/A"}
Purchase Date: ${format(new Date(warranty.purchase_date), "MMM dd, yyyy")}
Warranty Expires: ${format(new Date(warranty.warranty_end_date), "MMM dd, yyyy")}

Issue Type: ${formData.issue_type}
Issue Description: ${formData.issue_description}
Date Issue Occurred: ${format(new Date(formData.issue_date), "MMM dd, yyyy")}
Troubleshooting Attempted: ${formData.troubleshooting_attempted || "None"}
Desired Resolution: ${formData.desired_resolution}

Contact Information:
Email: ${formData.contact_email}
Phone: ${formData.contact_phone}

Thank you for your assistance.

Best regards
    `.trim());
    
    return `mailto:support@example.com?subject=${subject}&body=${body}`;
  };

  const handleReset = () => {
    setStep(1);
    setClaimId(null);
    setFormData({
      issue_type: "",
      issue_description: "",
      issue_date: format(new Date(), "yyyy-MM-dd"),
      troubleshooting_attempted: "",
      desired_resolution: "",
      attachments: [],
      contact_email: "",
      contact_phone: "",
      preferred_contact_method: "Email",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            File Warranty Claim
          </DialogTitle>
          <DialogDescription>
            {warranty.brand && `${warranty.brand} `}{warranty.product_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {step} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Step 1: Issue Details */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Document the Issue</h3>
              
              <div className="space-y-2">
                <Label>Issue Type *</Label>
                <Select
                  value={formData.issue_type}
                  onValueChange={(value) => setFormData({ ...formData, issue_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select issue type" />
                  </SelectTrigger>
                  <SelectContent>
                    {ISSUE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Issue Description *</Label>
                <Textarea
                  placeholder="Describe what happened and when you first noticed the issue..."
                  value={formData.issue_description}
                  onChange={(e) => setFormData({ ...formData, issue_description: e.target.value })}
                  rows={5}
                />
                <p className="text-xs text-muted-foreground">
                  {formData.issue_description.length}/500 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>When did the issue occur?</Label>
                <Input
                  type="date"
                  value={formData.issue_date}
                  onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                  max={format(new Date(), "yyyy-MM-dd")}
                />
              </div>

              <div className="space-y-2">
                <Label>Troubleshooting Attempted</Label>
                <Textarea
                  placeholder="What steps have you already tried to fix the issue? (Optional)"
                  value={formData.troubleshooting_attempted}
                  onChange={(e) => setFormData({ ...formData, troubleshooting_attempted: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Desired Resolution</Label>
                <Select
                  value={formData.desired_resolution}
                  onValueChange={(value) => setFormData({ ...formData, desired_resolution: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="What would you like?" />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIRED_RESOLUTIONS.map((resolution) => (
                      <SelectItem key={resolution} value={resolution}>
                        {resolution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleNext} className="w-full">
                Next: Add Photos/Videos
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Step 2: Photos/Videos */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Add Photos or Videos</h3>
              <p className="text-sm text-muted-foreground">
                Add photos or videos of the issue (optional but recommended)
              </p>

              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <input
                  type="file"
                  id="file-upload"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-4">
                      <Camera className="h-8 w-8 text-muted-foreground" />
                      <Upload className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-semibold">Click to upload photos or videos</p>
                    <p className="text-xs text-muted-foreground">Max 10 files, up to 10MB each</p>
                  </div>
                </label>
              </div>

              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Uploaded Files ({formData.attachments.length})</h4>
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm truncate flex-1">{file.name}</span>
                      <span className="text-xs text-muted-foreground mx-2">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Next: Contact Info
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Contact Info */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Contact Information</h3>
              <p className="text-sm text-muted-foreground">
                How should support contact you about this claim?
              </p>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Preferred Contact Method</Label>
                <Select
                  value={formData.preferred_contact_method}
                  onValueChange={(value) => setFormData({ ...formData, preferred_contact_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_METHODS.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
                  {submitting ? "Creating..." : "Create Claim"}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {step === 4 && (
            <div className="space-y-4 text-center py-6">
              <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-success" />
              </div>
              
              <h3 className="font-semibold text-xl">Claim Created Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                Your warranty claim has been saved. Here's what to do next:
              </p>

              <div className="space-y-3 text-left bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-sm">Quick Actions:</h4>
                
                <Button variant="outline" className="w-full" asChild>
                  <a href={generateSupportEmail()}>
                    <Mail className="h-4 w-4 mr-2" />
                    Email Pre-filled Claim to Support
                  </a>
                </Button>

                <Button variant="outline" className="w-full" onClick={() => toast.info("Opening phone...")}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call Support Now
                </Button>

                <Button variant="outline" className="w-full" onClick={() => toast.info("Claim tracking coming soon!")}>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Track Claim Status
                </Button>
              </div>

              <Button onClick={handleReset} className="w-full">
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

