-- ============================================================================
-- PHASE 1: DATABASE TABLES FOR ENHANCED FEATURES
-- Creates: ft_cache, ft_experiment_assignments, ft_quickwin_progress
-- ============================================================================

-- 1. ft_cache: Market data caching with TTL
CREATE TABLE public.ft_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  cache_type TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast lookups and TTL cleanup
CREATE INDEX idx_ft_cache_key ON public.ft_cache(cache_key);
CREATE INDEX idx_ft_cache_expires ON public.ft_cache(expires_at);
CREATE INDEX idx_ft_cache_type ON public.ft_cache(cache_type);

-- Enable RLS
ALTER TABLE public.ft_cache ENABLE ROW LEVEL SECURITY;

-- Public read access (cache is shared)
CREATE POLICY "Anyone can view cache"
  ON public.ft_cache FOR SELECT
  USING (true);

-- Only service role can modify cache (via edge functions)
CREATE POLICY "Service role can manage cache"
  ON public.ft_cache FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- 2. ft_experiment_assignments: A/B test tracking
CREATE TABLE public.ft_experiment_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  experiment_id TEXT NOT NULL,
  variant TEXT NOT NULL,
  converted BOOLEAN NOT NULL DEFAULT false,
  conversion_event TEXT,
  converted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, experiment_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_experiment_user ON public.ft_experiment_assignments(user_id);
CREATE INDEX idx_experiment_id ON public.ft_experiment_assignments(experiment_id);
CREATE INDEX idx_experiment_variant ON public.ft_experiment_assignments(experiment_id, variant);

-- Enable RLS
ALTER TABLE public.ft_experiment_assignments ENABLE ROW LEVEL SECURITY;

-- Users can view their own assignments
CREATE POLICY "Users can view their experiment assignments"
  ON public.ft_experiment_assignments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own assignments (when assigned to a variant)
CREATE POLICY "Users can create their experiment assignments"
  ON public.ft_experiment_assignments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assignments (for conversion tracking)
CREATE POLICY "Users can update their experiment assignments"
  ON public.ft_experiment_assignments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. ft_quickwin_progress: Gamified quick win tracking
CREATE TABLE public.ft_quickwin_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  idea_id UUID NOT NULL,
  quick_win TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed')),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, idea_id)
);

-- Indexes for fast lookups
CREATE INDEX idx_quickwin_user ON public.ft_quickwin_progress(user_id);
CREATE INDEX idx_quickwin_idea ON public.ft_quickwin_progress(idea_id);
CREATE INDEX idx_quickwin_status ON public.ft_quickwin_progress(status);

-- Enable RLS
ALTER TABLE public.ft_quickwin_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own progress
CREATE POLICY "Users can view their quickwin progress"
  ON public.ft_quickwin_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own progress
CREATE POLICY "Users can create their quickwin progress"
  ON public.ft_quickwin_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their quickwin progress"
  ON public.ft_quickwin_progress FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own progress
CREATE POLICY "Users can delete their quickwin progress"
  ON public.ft_quickwin_progress FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Update ft_events with session tracking (add columns if not exist)
ALTER TABLE public.ft_events ADD COLUMN IF NOT EXISTS page_path TEXT;
ALTER TABLE public.ft_events ADD COLUMN IF NOT EXISTS referrer TEXT;
ALTER TABLE public.ft_events ADD COLUMN IF NOT EXISTS device_type TEXT;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_ft_events_name ON public.ft_events(event_name);
CREATE INDEX IF NOT EXISTS idx_ft_events_created ON public.ft_events(created_at);

-- Auto-update timestamps triggers
CREATE TRIGGER update_ft_cache_updated_at
  BEFORE UPDATE ON public.ft_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ft_experiment_assignments_updated_at
  BEFORE UPDATE ON public.ft_experiment_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ft_quickwin_progress_updated_at
  BEFORE UPDATE ON public.ft_quickwin_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();