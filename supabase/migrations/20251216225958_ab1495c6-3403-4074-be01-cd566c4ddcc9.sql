-- ==========================================
-- Phase 1: Fix CDAP and Women Entrepreneurship Fund
-- ==========================================
UPDATE canadian_grants 
SET status = 'closed', 
    last_verified = NOW(),
    eligibility_notes = COALESCE(eligibility_notes, '') || ' Program closed as of March 2024. No longer accepting applications.'
WHERE name ILIKE '%CDAP%' OR name ILIKE '%digital adoption program%';

UPDATE canadian_grants 
SET status = 'closed', 
    last_verified = NOW(),
    eligibility_notes = COALESCE(eligibility_notes, '') || ' Program ended. Replaced by Women Entrepreneurship Strategy (WES).'
WHERE name ILIKE '%Women Entrepreneurship Fund%';

-- ==========================================
-- Phase 2: Add admin flag to profiles
-- ==========================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- ==========================================
-- Phase 3: Add verification tracking to grants
-- ==========================================
ALTER TABLE canadian_grants 
ADD COLUMN IF NOT EXISTS verification_notes text,
ADD COLUMN IF NOT EXISTS verification_source text,
ADD COLUMN IF NOT EXISTS auto_verified_at timestamptz;

-- ==========================================
-- Phase 4: RLS policy for admin grant updates
-- ==========================================
CREATE POLICY "Admins can update grants"
ON canadian_grants FOR UPDATE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can insert grants"
ON canadian_grants FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Admins can delete grants"
ON canadian_grants FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- ==========================================
-- Phase 5: Insert missing Canadian programs (using valid types: grant, loan, program)
-- ==========================================

-- Federal Programs
INSERT INTO canadian_grants (name, organization, type, province, status, description, why_apply, application_url, amount_min, amount_max, eligibility_notes, eligibility_sectors, eligibility_age_min, eligibility_age_max, eligibility_citizen_required, eligibility_pr_eligible, eligibility_newcomer_max_years, eligibility_indigenous_only, last_verified)
VALUES 
-- SR&ED Tax Credit (using 'grant' type as proxy for tax credit)
('Scientific Research & Experimental Development (SR&ED)', 'Canada Revenue Agency', 'grant', NULL, 'open', 'Federal tax incentive program for businesses conducting R&D in Canada. Offers investment tax credits for eligible R&D expenditures.', 'Recover up to 35% of eligible R&D costs. Available to businesses of all sizes across all industries.', 'https://www.canada.ca/en/revenue-agency/services/scientific-research-experimental-development-tax-incentive-program.html', 0, 3000000, 'Tax credit program. Must have eligible R&D activities. Available to corporations carrying on business in Canada.', ARRAY['technology', 'manufacturing', 'life_sciences', 'agriculture', 'energy'], 18, 99, false, true, NULL, false, NOW()),

-- IRAP
('Industrial Research Assistance Program (IRAP)', 'National Research Council Canada', 'grant', NULL, 'open', 'Provides advice, connections, and funding to help Canadian SMEs increase their innovation capacity and commercialize R&D.', 'Access up to $10M in non-repayable contributions plus expert advisory services.', 'https://nrc.canada.ca/en/support-technology-innovation/industrial-research-assistance-program', 0, 10000000, 'For incorporated Canadian SMEs with 500 or fewer full-time employees. Must be growth-oriented with R&D capacity.', ARRAY['technology', 'manufacturing', 'life_sciences', 'cleantech'], 18, 99, false, true, NULL, false, NOW()),

-- CanExport SMEs
('CanExport SMEs', 'Trade Commissioner Service', 'grant', NULL, 'open', 'Provides funding to help Canadian SMEs explore and develop new export opportunities.', 'Get up to $75,000 to cover international market development costs.', 'https://www.tradecommissioner.gc.ca/funding-financement/canexport/sme-pme/index.aspx', 10000, 75000, 'Canadian SME with fewer than 500 employees. Annual revenue between $200K-$100M. Must target new export markets.', ARRAY['manufacturing', 'technology', 'food_beverage', 'services'], 18, 99, false, true, NULL, false, NOW()),

-- Black Entrepreneurship Program
('Black Entrepreneurship Program', 'Innovation, Science and Economic Development Canada', 'loan', NULL, 'open', 'Provides loans and support to Black Canadian entrepreneurs and business owners.', 'Access loans up to $250,000 with mentorship and business support services.', 'https://ised-isde.canada.ca/site/black-entrepreneurship-program/en', 25000, 250000, 'Black Canadian entrepreneurs and business owners. Must be a Canadian citizen or permanent resident.', NULL, 18, 99, true, true, NULL, false, NOW()),

-- Women Entrepreneurship Strategy
('Women Entrepreneurship Strategy (WES)', 'Innovation, Science and Economic Development Canada', 'program', NULL, 'open', 'Comprehensive strategy to help women grow their businesses through access to financing, talent, networks, and expertise.', 'Access funding, mentorship, and networking opportunities specifically designed for women entrepreneurs.', 'https://ised-isde.canada.ca/site/women-entrepreneurship-strategy/en', 0, 100000, 'Women-owned or women-led businesses in Canada.', NULL, 18, 99, false, true, NULL, false, NOW()),

-- Futurpreneur Canada
('Futurpreneur Canada', 'Futurpreneur Canada', 'loan', NULL, 'open', 'Provides financing, mentoring, and support tools to aspiring business owners aged 18-39.', 'Get up to $60,000 in startup financing plus 2 years of mentorship from a business expert.', 'https://www.futurpreneur.ca/', 15000, 60000, 'Canadian citizens or permanent residents aged 18-39. Business must be full-time commitment and operating less than 12 months.', NULL, 18, 39, true, true, NULL, false, NOW()),

-- Canada Small Business Financing Program
('Canada Small Business Financing Program (CSBFP)', 'Innovation, Science and Economic Development Canada', 'loan', NULL, 'open', 'Helps small businesses access financing by sharing the risk with lenders.', 'Access loans up to $1.15M for equipment, leasehold improvements, and real property.', 'https://ised-isde.canada.ca/site/canada-small-business-financing-program/en', 0, 1150000, 'Canadian small businesses with gross annual revenues of $10M or less.', NULL, 18, 99, false, true, NULL, false, NOW()),

-- Indigenous Business and Entrepreneurship Program
('Indigenous Business and Entrepreneurship Program', 'Indigenous Services Canada', 'grant', NULL, 'open', 'Supports Indigenous entrepreneurs and communities in starting and growing businesses.', 'Non-repayable contributions for business planning, startup costs, expansion, and business support services.', 'https://www.sac-isc.gc.ca/eng/1582037564226/1610797399865', 0, 99999, 'Indigenous entrepreneurs (First Nations, Inuit, Métis). Business must be at least 51% Indigenous-owned.', NULL, 18, 99, false, true, NULL, true, NOW()),

-- Ontario Programs
('Starter Company Plus', 'Ontario Ministry of Economic Development', 'grant', 'ON', 'open', 'Provides training, mentorship and a grant of up to $5,000 to help entrepreneurs start or grow their business in Ontario.', 'Get hands-on training, one-on-one mentoring, and up to $5,000 in grant funding.', 'https://www.ontario.ca/page/start-or-grow-your-business-starter-company-plus', 0, 5000, 'Ontario residents 18+. Must complete training program. Business must be operating or starting in Ontario.', NULL, 18, 99, false, true, NULL, false, NOW()),

('Summer Company', 'Ontario Ministry of Economic Development', 'grant', 'ON', 'open', 'Provides students aged 15-29 with hands-on business training and mentoring, plus awards up to $3,000.', 'Run your own summer business with up to $3,000 in funding and business coaching.', 'https://www.ontario.ca/page/summer-company', 0, 3000, 'Ontario students aged 15-29 returning to school. Must commit to running business full-time during summer.', NULL, 15, 29, false, true, NULL, false, NOW()),

-- BC Programs
('BC Small Business Venture Capital Tax Credit', 'BC Ministry of Finance', 'grant', 'BC', 'open', 'Provides a 30% refundable tax credit to investors who invest in eligible small businesses.', 'Attract investors to your business with significant tax benefits for them.', 'https://www2.gov.bc.ca/gov/content/taxes/income-taxes/corporate/credits/venture-capital', 0, 300000, 'Tax credit program. BC-based small businesses that meet eligibility criteria. Must register as an eligible business corporation.', ARRAY['technology', 'manufacturing', 'life_sciences', 'cleantech'], 18, 99, false, true, NULL, false, NOW()),

('Innovate BC Programs', 'Innovate BC', 'program', 'BC', 'open', 'Suite of programs supporting tech sector growth including ignite, venture acceleration, and new ventures programs.', 'Access mentorship, funding, and connections to grow your tech business.', 'https://www.innovatebc.ca/', 0, 300000, 'BC-based technology companies at various stages of growth.', ARRAY['technology', 'cleantech', 'life_sciences'], 18, 99, false, true, NULL, false, NOW()),

-- Alberta Programs
('Alberta Innovates Programs', 'Alberta Innovates', 'grant', 'AB', 'open', 'Offers various funding programs for tech companies, researchers, and entrepreneurs in Alberta.', 'Access grants, vouchers, and support for innovation and commercialization.', 'https://albertainnovates.ca/', 0, 500000, 'Alberta-based businesses, researchers, and entrepreneurs working on innovative projects.', ARRAY['technology', 'cleantech', 'health', 'agriculture', 'energy'], 18, 99, false, true, NULL, false, NOW()),

-- Quebec Programs
('PME MTL', 'City of Montreal', 'loan', 'QC', 'open', 'Provides financing and support services to Montreal-area businesses at all stages of development.', 'Access loans, grants, and expert advice to start or grow your Montreal business.', 'https://pmemtl.com/en', 5000, 300000, 'Businesses located in the Montreal area. Various eligibility criteria depending on specific program.', NULL, 18, 99, false, true, NULL, false, NOW()),

('Investissement Quebec', 'Investissement Quebec', 'loan', 'QC', 'open', 'Government corporation providing financing solutions and support for Quebec businesses.', 'Access loans, guarantees, and equity investments for business growth and expansion.', 'https://www.investquebec.com/quebec/en/', 50000, 5000000, 'Businesses operating in Quebec with growth potential.', NULL, 18, 99, false, true, NULL, false, NOW())

ON CONFLICT (id) DO NOTHING;