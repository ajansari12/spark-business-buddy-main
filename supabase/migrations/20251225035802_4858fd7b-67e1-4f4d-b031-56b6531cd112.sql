-- Create referral codes table
CREATE TABLE public.ft_referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create referrals table
CREATE TABLE public.ft_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID,
  status TEXT DEFAULT 'pending',
  reward_type TEXT,
  reward_amount NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  converted_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.ft_referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ft_referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for referral codes
CREATE POLICY "Users can view their own referral code" 
ON public.ft_referral_codes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own referral code" 
ON public.ft_referral_codes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS policies for referrals
CREATE POLICY "Users can view their own referrals" 
ON public.ft_referrals 
FOR SELECT 
USING (auth.uid() = referrer_id);

CREATE POLICY "Users can create referrals" 
ON public.ft_referrals 
FOR INSERT 
WITH CHECK (auth.uid() = referrer_id);

CREATE POLICY "Users can update their own referrals" 
ON public.ft_referrals 
FOR UPDATE 
USING (auth.uid() = referrer_id);

-- Function to generate referral code for new users
CREATE OR REPLACE FUNCTION public.create_referral_code_for_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Generate a unique 8-character code
  new_code := upper(substring(md5(random()::text || NEW.id::text) from 1 for 8));
  
  INSERT INTO public.ft_referral_codes (user_id, code)
  VALUES (NEW.id, new_code)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to auto-create referral code when profile is created
CREATE TRIGGER on_profile_created_create_referral_code
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_referral_code_for_user();