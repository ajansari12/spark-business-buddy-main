-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE public.session_status AS ENUM ('intake', 'ready_to_pay', 'paid', 'generating', 'ideas_generated', 'completed');
CREATE TYPE public.session_type AS ENUM ('tier1_idea');
CREATE TYPE public.message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE public.doc_type AS ENUM ('tier1_report');
CREATE TYPE public.order_tier AS ENUM ('tier1', 'tier2', 'tier3');
CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed');

-- =============================================
-- TABLE: ft_sessions
-- =============================================
CREATE TABLE public.ft_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.session_status NOT NULL DEFAULT 'intake',
  session_type public.session_type NOT NULL DEFAULT 'tier1_idea',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  collected_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ft_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ft_sessions_user_id ON public.ft_sessions(user_id);
CREATE INDEX idx_ft_sessions_updated_at ON public.ft_sessions(updated_at DESC);

CREATE TRIGGER update_ft_sessions_updated_at
  BEFORE UPDATE ON public.ft_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE POLICY "Users can view their own sessions"
  ON public.ft_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions"
  ON public.ft_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.ft_sessions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- TABLE: ft_messages
-- =============================================
CREATE TABLE public.ft_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ft_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.message_role NOT NULL,
  content TEXT NOT NULL,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ft_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ft_messages_session_id ON public.ft_messages(session_id);
CREATE INDEX idx_ft_messages_created_at ON public.ft_messages(session_id, created_at);

CREATE POLICY "Users can view messages from their sessions"
  ON public.ft_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ft_sessions
      WHERE ft_sessions.id = ft_messages.session_id
      AND ft_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages to their sessions"
  ON public.ft_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.ft_sessions
      WHERE ft_sessions.id = session_id
      AND ft_sessions.user_id = auth.uid()
    )
  );

-- =============================================
-- TABLE: ft_ideas
-- =============================================
CREATE TABLE public.ft_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.ft_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  viability_score NUMERIC(3,1) CHECK (viability_score >= 0 AND viability_score <= 10),
  investment_min INTEGER,
  investment_max INTEGER,
  time_to_revenue TEXT,
  market_analysis JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ft_ideas ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ft_ideas_session_id ON public.ft_ideas(session_id);
CREATE INDEX idx_ft_ideas_user_id ON public.ft_ideas(user_id);

CREATE POLICY "Users can view their own ideas"
  ON public.ft_ideas FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- TABLE: ft_documents
-- =============================================
CREATE TABLE public.ft_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.ft_sessions(id) ON DELETE SET NULL,
  doc_type public.doc_type NOT NULL,
  file_path TEXT,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ft_documents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ft_documents_user_id ON public.ft_documents(user_id);

CREATE POLICY "Users can view their own documents"
  ON public.ft_documents FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- TABLE: ft_orders
-- =============================================
CREATE TABLE public.ft_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.ft_sessions(id) ON DELETE SET NULL,
  tier public.order_tier NOT NULL,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  stripe_checkout_session_id TEXT,
  stripe_payment_intent_id TEXT,
  status public.order_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ft_orders ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ft_orders_user_id ON public.ft_orders(user_id);
CREATE INDEX idx_ft_orders_status ON public.ft_orders(user_id, status);

CREATE POLICY "Users can view their own orders"
  ON public.ft_orders FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================
-- TABLE: ft_events
-- =============================================
CREATE TABLE public.ft_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id UUID REFERENCES public.ft_sessions(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ft_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_ft_events_user_id ON public.ft_events(user_id);
CREATE INDEX idx_ft_events_event_name ON public.ft_events(user_id, event_name);

CREATE POLICY "Users can view their own events"
  ON public.ft_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events"
  ON public.ft_events FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);