-- Add unique constraint for province_code + structure_type to enable upsert
ALTER TABLE public.business_structure_fees 
ADD CONSTRAINT business_structure_fees_province_structure_unique 
UNIQUE (province_code, structure_type);
