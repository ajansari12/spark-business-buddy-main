-- Create table for Perplexity-verified business structure fees
CREATE TABLE public.business_structure_fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  province_code TEXT NOT NULL,
  structure_type TEXT NOT NULL,
  verified_fee TEXT NOT NULL,
  fee_notes TEXT,
  perplexity_sources TEXT[],
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(province_code, structure_type)
);

-- Enable RLS
ALTER TABLE public.business_structure_fees ENABLE ROW LEVEL SECURITY;

-- Anyone can read fees (public data)
CREATE POLICY "Anyone can view business structure fees"
  ON public.business_structure_fees
  FOR SELECT
  USING (true);

-- Only admins can modify fees
CREATE POLICY "Admins can insert fees"
  ON public.business_structure_fees
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update fees"
  ON public.business_structure_fees
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_business_structure_fees_updated_at
  BEFORE UPDATE ON public.business_structure_fees
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();