-- Canadian Grants Database for Eligibility Filtering
-- Phase 1 of Smart Eligibility Enhancement

CREATE TABLE public.canadian_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  organization TEXT NOT NULL,
  province TEXT, -- NULL for national programs
  type TEXT NOT NULL CHECK (type IN ('grant', 'loan', 'program', 'guide', 'accelerator')),
  
  -- Funding details
  amount_min INTEGER,
  amount_max INTEGER,
  funding_description TEXT,
  
  -- Eligibility rules
  eligibility_age_min INTEGER DEFAULT 18,
  eligibility_age_max INTEGER DEFAULT 99,
  eligibility_citizen_required BOOLEAN DEFAULT false,
  eligibility_pr_eligible BOOLEAN DEFAULT true,
  eligibility_newcomer_max_years INTEGER, -- NULL if not newcomer-specific
  eligibility_indigenous_only BOOLEAN DEFAULT false,
  eligibility_sectors TEXT[], -- NULL if all sectors
  eligibility_notes TEXT, -- Human-readable eligibility summary
  
  -- Application details
  application_url TEXT NOT NULL,
  deadline DATE, -- NULL if rolling
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'upcoming', 'unknown')),
  
  -- Metadata
  description TEXT,
  why_apply TEXT, -- "Best for..." summary
  last_verified TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.canadian_grants ENABLE ROW LEVEL SECURITY;

-- Public read access (grants are public info)
CREATE POLICY "Anyone can view grants" 
  ON public.canadian_grants 
  FOR SELECT 
  USING (true);

-- Indexes for fast eligibility queries
CREATE INDEX idx_grants_province ON public.canadian_grants(province);
CREATE INDEX idx_grants_status ON public.canadian_grants(status);
CREATE INDEX idx_grants_age ON public.canadian_grants(eligibility_age_min, eligibility_age_max);
CREATE INDEX idx_grants_type ON public.canadian_grants(type);

-- Trigger for updated_at
CREATE TRIGGER update_canadian_grants_updated_at
  BEFORE UPDATE ON public.canadian_grants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed with initial Canadian grants data
INSERT INTO public.canadian_grants (name, organization, province, type, amount_min, amount_max, funding_description, eligibility_age_min, eligibility_age_max, eligibility_citizen_required, eligibility_pr_eligible, eligibility_newcomer_max_years, eligibility_indigenous_only, eligibility_notes, application_url, status, description, why_apply) VALUES

-- FEDERAL PROGRAMS
('Futurpreneur Canada', 'Futurpreneur', NULL, 'loan', 20000, 60000, 'Up to $60,000 financing', 18, 39, false, true, NULL, false, 'Ages 18-39, Canadian citizen or PR', 'https://www.futurpreneur.ca/', 'open', 'Financing up to $60,000, mentoring for 2 years, and resources for young entrepreneurs', 'Best for young entrepreneurs under 40 with a business plan'),

('Canada Small Business Financing Program (CSBFP)', 'Government of Canada', NULL, 'loan', 10000, 1000000, 'Up to $1,000,000', 18, 99, false, true, NULL, false, 'All ages, citizen or PR', 'https://ised-isde.canada.ca/site/canada-small-business-financing-program/en', 'open', 'Government-backed loans for equipment, leasehold improvements, and real property', 'Best for established businesses needing equipment or property financing'),

('Canada Digital Adoption Program (CDAP)', 'Government of Canada', NULL, 'grant', 2400, 15000, 'Up to $15,000', 18, 99, false, true, NULL, false, 'Existing businesses with revenue', 'https://ised-isde.canada.ca/site/canada-digital-adoption-program/en', 'open', 'Grants to help small businesses adopt digital technologies', 'Best for businesses wanting to modernize with technology'),

('BDC Small Business Loan', 'Business Development Bank of Canada', NULL, 'loan', 10000, 100000, '$10,000 to $100,000+', 18, 99, false, true, NULL, false, 'All ages, citizen or PR', 'https://www.bdc.ca/en/financing/business-loans/small-business-loan', 'open', 'Flexible loans for Canadian entrepreneurs with competitive rates', 'Best for any Canadian business needing growth capital'),

('Women Entrepreneurship Fund', 'Government of Canada', NULL, 'grant', 5000, 100000, 'Up to $100,000', 18, 99, false, true, NULL, false, 'Women-owned businesses (51%+ ownership)', 'https://www.ic.gc.ca/eic/site/107.nsf/eng/home', 'open', 'Funding for women-owned or women-led businesses to grow and access new markets', 'Best for women entrepreneurs scaling their business'),

('Indigenous Business Development Program', 'Indigenous Services Canada', NULL, 'grant', 10000, 99999, 'Varies by project', 18, 99, false, true, NULL, true, 'Indigenous entrepreneurs only', 'https://www.sac-isc.gc.ca/eng/1582037564226/1610797399865', 'open', 'Support for Indigenous entrepreneurs to start and grow businesses', 'Best for Indigenous entrepreneurs across Canada'),

('Startup Visa Program', 'Immigration, Refugees and Citizenship Canada', NULL, 'program', 0, 0, 'Permanent residency pathway', 18, 99, false, false, NULL, false, 'Non-Canadian with designated organization support', 'https://www.canada.ca/en/immigration-refugees-citizenship/services/immigrate-canada/start-visa.html', 'open', 'Pathway to permanent residence for immigrant entrepreneurs with innovative business ideas', 'Best for international entrepreneurs with innovative tech ideas'),

-- ONTARIO PROGRAMS
('Ontario Self-Employment Benefit', 'Government of Ontario', 'Ontario', 'program', 0, 0, 'Income support while starting', 18, 99, false, true, NULL, false, 'Must be receiving or recently received EI', 'https://www.ontario.ca/page/self-employment-benefit', 'open', 'Income support while you develop your business plan and launch', 'Best for those transitioning from employment to self-employment'),

('Digital Main Street', 'Digital Main Street', 'Ontario', 'grant', 0, 2500, 'Up to $2,500', 18, 99, false, true, NULL, false, 'Brick-and-mortar businesses', 'https://digitalmainstreet.ca/', 'open', 'Free digital transformation services and grants for small businesses', 'Best for retail and service businesses going digital'),

('Starter Company Plus', 'Government of Ontario', 'Ontario', 'grant', 0, 5000, 'Up to $5,000', 18, 29, false, true, NULL, false, 'Ages 18-29, Ontario resident', 'https://www.ontario.ca/page/start-business', 'open', 'Training and grants for young Ontario entrepreneurs', 'Best for young entrepreneurs in Ontario starting their first business'),

-- BRITISH COLUMBIA PROGRAMS
('Small Business BC', 'Small Business BC', 'British Columbia', 'program', 0, 0, 'Free advisory services', 18, 99, false, true, NULL, false, 'BC-based businesses', 'https://smallbusinessbc.ca/', 'open', 'Free business advisory services, education, and resources', 'Best for BC entrepreneurs needing guidance and support'),

('BC Employer Training Grant', 'Government of BC', 'British Columbia', 'grant', 0, 10000, 'Up to 80% of training costs', 18, 99, false, true, NULL, false, 'BC employers', 'https://www.workbc.ca/employer-resources/bc-employer-training-grant', 'open', 'Training subsidies for business owners and employees', 'Best for businesses investing in employee skills'),

('Innovate BC Programs', 'Innovate BC', 'British Columbia', 'grant', 10000, 300000, 'Varies by program', 18, 99, false, true, NULL, false, 'Tech and innovation companies', 'https://www.innovatebc.ca/', 'open', 'Various funding programs for BC tech and innovation companies', 'Best for tech startups and innovation-focused businesses'),

-- ALBERTA PROGRAMS
('Alberta Innovates', 'Alberta Innovates', 'Alberta', 'grant', 10000, 500000, 'Varies by program', 18, 99, false, true, NULL, false, 'Alberta-based innovation companies', 'https://albertainnovates.ca/', 'open', 'Funding for innovative startups and tech companies in Alberta', 'Best for tech and innovation startups in Alberta'),

('Community Futures Alberta', 'Community Futures Network', 'Alberta', 'loan', 5000, 150000, 'Up to $150,000', 18, 99, false, true, NULL, false, 'Rural Alberta entrepreneurs', 'https://albertacf.com/', 'open', 'Loans and business support for rural Alberta entrepreneurs', 'Best for rural Alberta businesses'),

-- QUEBEC PROGRAMS  
('Investissement Québec', 'Investissement Québec', 'Quebec', 'loan', 50000, 5000000, 'Varies by program', 18, 99, false, true, NULL, false, 'Quebec-based businesses', 'https://www.investquebec.com/quebec/en/', 'open', 'Various financing solutions for Quebec businesses', 'Best for Quebec businesses of all sizes'),

('PME MTL', 'PME MTL', 'Quebec', 'loan', 5000, 100000, 'Up to $100,000', 18, 99, false, true, NULL, false, 'Montreal-area businesses', 'https://pmemtl.com/en', 'open', 'Financing and support for Montreal entrepreneurs', 'Best for Montreal-based startups and small businesses'),

-- NEWCOMER-SPECIFIC PROGRAMS
('SEED Winnipeg', 'SEED Winnipeg', 'Manitoba', 'loan', 1000, 20000, 'Up to $20,000', 18, 99, false, true, 5, false, 'Newcomers to Canada (within 5 years)', 'https://seedwinnipeg.ca/', 'open', 'Microloans and business support specifically for newcomers', 'Best for recent immigrants starting a business'),

('Newcomer Entrepreneur Program', 'ACCES Employment', 'Ontario', 'program', 0, 0, 'Free training and support', 18, 99, false, true, 5, false, 'Newcomers to Canada (within 5 years)', 'https://accesemployment.ca/our-services/entrepreneurship', 'open', 'Free entrepreneurship training and mentorship for newcomers', 'Best for newcomers exploring entrepreneurship'),

('Immigrant Access Fund', 'Windmill Microlending', NULL, 'loan', 2000, 15000, 'Up to $15,000', 18, 99, false, true, 10, false, 'Skilled immigrants and refugees', 'https://www.windmillmicrolending.org/', 'open', 'Affordable loans for skilled immigrants to invest in their careers or businesses', 'Best for immigrants needing funds for credentials or business startup');
