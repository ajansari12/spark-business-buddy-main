-- Update canadian_resources in ft_ideas to add URLs for known programs
UPDATE ft_ideas
SET canadian_resources = (
  SELECT jsonb_agg(
    CASE 
      -- Federal Programs
      WHEN resource->>'name' ILIKE '%Futurpreneur%' THEN 
        resource || '{"url": "https://www.futurpreneur.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%BDC%' OR resource->>'name' ILIKE '%Business Development Bank%' THEN 
        resource || '{"url": "https://www.bdc.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%Canada Small Business Financing%' OR resource->>'name' ILIKE '%CSBFP%' THEN 
        resource || '{"url": "https://ised-isde.canada.ca/site/canada-small-business-financing-program/en"}'::jsonb
      WHEN resource->>'name' ILIKE '%IRAP%' OR resource->>'name' ILIKE '%Industrial Research Assistance%' THEN 
        resource || '{"url": "https://nrc.canada.ca/en/support-technology-innovation"}'::jsonb
      WHEN resource->>'name' ILIKE '%Canada Digital Adoption%' OR resource->>'name' ILIKE '%CDAP%' THEN 
        resource || '{"url": "https://ised-isde.canada.ca/site/canada-digital-adoption-program/en"}'::jsonb
      WHEN resource->>'name' ILIKE '%CanExport%' THEN 
        resource || '{"url": "https://www.tradecommissioner.gc.ca/funding-financement/canexport/index.aspx"}'::jsonb
      WHEN resource->>'name' ILIKE '%Women Entrepreneurship%' OR resource->>'name' ILIKE '%WES%' THEN 
        resource || '{"url": "https://ised-isde.canada.ca/site/women-entrepreneurship-strategy/en"}'::jsonb
      -- Ontario Programs
      WHEN resource->>'name' ILIKE '%Starter Company Plus%' THEN 
        resource || '{"url": "https://www.ontario.ca/page/start-business"}'::jsonb
      WHEN resource->>'name' ILIKE '%Summer Company%' THEN 
        resource || '{"url": "https://www.ontario.ca/page/summer-company-program"}'::jsonb
      WHEN resource->>'name' ILIKE '%Ontario Centre%Innovation%' OR resource->>'name' ILIKE '%OCI%' THEN 
        resource || '{"url": "https://www.oc-innovation.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%Digital Main Street%' THEN 
        resource || '{"url": "https://digitalmainstreet.ca/"}'::jsonb
      -- BC Programs
      WHEN resource->>'name' ILIKE '%Small Business BC%' THEN 
        resource || '{"url": "https://smallbusinessbc.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%Innovate BC%' THEN 
        resource || '{"url": "https://www.innovatebc.ca/"}'::jsonb
      -- Alberta Programs
      WHEN resource->>'name' ILIKE '%Alberta Innovates%' THEN 
        resource || '{"url": "https://albertainnovates.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%Community Futures%' THEN 
        resource || '{"url": "https://communityfutures.ca/"}'::jsonb
      -- Quebec Programs
      WHEN resource->>'name' ILIKE '%Investissement Qu%' THEN 
        resource || '{"url": "https://www.investquebec.com/"}'::jsonb
      WHEN resource->>'name' ILIKE '%PME MTL%' THEN 
        resource || '{"url": "https://pmemtl.com/"}'::jsonb
      -- Other common programs
      WHEN resource->>'name' ILIKE '%MaRS%' THEN 
        resource || '{"url": "https://www.marsdd.com/"}'::jsonb
      WHEN resource->>'name' ILIKE '%Communitech%' THEN 
        resource || '{"url": "https://www.communitech.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%DMZ%' THEN 
        resource || '{"url": "https://dmz.torontomu.ca/"}'::jsonb
      WHEN resource->>'name' ILIKE '%Venture%Ontario%' THEN 
        resource || '{"url": "https://www.ventureon.ca/"}'::jsonb
      ELSE resource
    END
  )
  FROM jsonb_array_elements(ft_ideas.canadian_resources) AS resource
  WHERE resource->>'url' IS NULL OR resource->>'url' = ''
)
WHERE canadian_resources IS NOT NULL 
  AND jsonb_array_length(canadian_resources) > 0;