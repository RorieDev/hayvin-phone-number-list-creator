-- Hayvin Phone Number List Creator
-- Initial Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  daily_dial_target INTEGER DEFAULT 100,
  start_date DATE,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  place_id VARCHAR(255) UNIQUE,
  business_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(50),
  address TEXT,
  website VARCHAR(500),
  rating DECIMAL(2,1),
  total_ratings INTEGER DEFAULT 0,
  category VARCHAR(100),
  business_status VARCHAR(50),
  google_maps_url TEXT,
  source_query TEXT,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'callback', 'qualified', 'not_interested')),
  notes TEXT,
  last_called_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Call logs table
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  call_outcome VARCHAR(50) NOT NULL CHECK (call_outcome IN (
    'answered', 
    'voicemail', 
    'no_answer', 
    'busy', 
    'callback_scheduled', 
    'qualified', 
    'not_interested', 
    'wrong_number', 
    'do_not_call'
  )),
  notes TEXT,
  duration_seconds INTEGER,
  scheduled_callback TIMESTAMP WITH TIME ZONE,
  called_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_phone_number ON leads(phone_number);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_campaign_id ON call_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_called_at ON call_logs(called_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_scheduled_callback ON call_logs(scheduled_callback);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_campaigns_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - disabled for single user mode
-- ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;
