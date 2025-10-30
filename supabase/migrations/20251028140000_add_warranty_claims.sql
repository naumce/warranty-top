-- Create warranty_claims table
CREATE TABLE IF NOT EXISTS warranty_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  warranty_id UUID NOT NULL REFERENCES warranties(id) ON DELETE CASCADE,
  
  -- Claim Information
  claim_number VARCHAR(255),
  claim_status VARCHAR(50) NOT NULL DEFAULT 'draft',
  -- Status: draft, submitted, under_review, approved, denied, completed, cancelled
  
  -- Issue Details
  issue_type VARCHAR(100),
  issue_description TEXT NOT NULL,
  issue_date DATE,
  troubleshooting_attempted TEXT,
  desired_resolution VARCHAR(100),
  
  -- Contact Information
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  preferred_contact_method VARCHAR(50),
  
  -- Submission Details
  submitted_at TIMESTAMP WITH TIME ZONE,
  submitted_via VARCHAR(50),
  -- Submission method: email, portal, phone, in_store
  
  -- Tracking
  claim_portal_url TEXT,
  support_email VARCHAR(255),
  support_phone VARCHAR(50),
  reference_number VARCHAR(255),
  
  -- Status Updates
  status_history JSONB DEFAULT '[]'::jsonb,
  last_status_update TIMESTAMP WITH TIME ZONE,
  estimated_resolution_date DATE,
  actual_resolution_date DATE,
  
  -- Follow-up
  next_followup_date DATE,
  followup_notes TEXT,
  
  -- Resolution
  resolution_type VARCHAR(100),
  resolution_notes TEXT,
  replacement_tracking_number VARCHAR(255),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create warranty_claim_attachments table for photos/videos
CREATE TABLE IF NOT EXISTS warranty_claim_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id UUID NOT NULL REFERENCES warranty_claims(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size INTEGER,
  storage_path TEXT NOT NULL,
  url TEXT,
  
  attachment_type VARCHAR(50) NOT NULL,
  -- Types: issue_photo, issue_video, receipt, documentation, other
  
  description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_warranty_claims_user_id ON warranty_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_warranty_id ON warranty_claims(warranty_id);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_status ON warranty_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_warranty_claims_submitted_at ON warranty_claims(submitted_at);
CREATE INDEX IF NOT EXISTS idx_warranty_claim_attachments_claim_id ON warranty_claim_attachments(claim_id);

-- Enable Row Level Security
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claim_attachments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for warranty_claims
CREATE POLICY "Users can view their own claims"
  ON warranty_claims FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claims"
  ON warranty_claims FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own claims"
  ON warranty_claims FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claims"
  ON warranty_claims FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for warranty_claim_attachments
CREATE POLICY "Users can view their own claim attachments"
  ON warranty_claim_attachments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own claim attachments"
  ON warranty_claim_attachments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own claim attachments"
  ON warranty_claim_attachments FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_warranty_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER warranty_claims_updated_at
  BEFORE UPDATE ON warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION update_warranty_claims_updated_at();

-- Create function to add status history
CREATE OR REPLACE FUNCTION add_claim_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.claim_status IS DISTINCT FROM NEW.claim_status THEN
    NEW.status_history = NEW.status_history || jsonb_build_object(
      'status', NEW.claim_status,
      'timestamp', NOW(),
      'note', COALESCE(NEW.followup_notes, '')
    );
    NEW.last_status_update = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for status history
CREATE TRIGGER warranty_claims_status_history
  BEFORE UPDATE ON warranty_claims
  FOR EACH ROW
  EXECUTE FUNCTION add_claim_status_history();

