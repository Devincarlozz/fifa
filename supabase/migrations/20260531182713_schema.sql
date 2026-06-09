-- supabase/migrations/20260531182713_schema.sql

-- Enable uuid-ossp if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  photo_url text,
  total_points integer DEFAULT 0,
  predictions_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_admin boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create admin helper function
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql;

-- Create matches table
CREATE TABLE public.matches (
  id text PRIMARY KEY,
  home_team jsonb NOT NULL,
  away_team jsonb NOT NULL,
  kickoff_time timestamp with time zone NOT NULL,
  stage text NOT NULL,
  venue text NOT NULL,
  status text NOT NULL DEFAULT 'SCHEDULED',
  live_score jsonb NOT NULL DEFAULT '{"home": 0, "away": 0}'::jsonb,
  minute integer,
  goalscorers jsonb NOT NULL DEFAULT '[]'::jsonb,
  cards jsonb NOT NULL DEFAULT '[]'::jsonb,
  bonus_question text NOT NULL,
  confirmed boolean NOT NULL DEFAULT false,
  confirmed_result jsonb,
  confirmed_motm text,
  confirmed_bonus_answer text,
  confirmed_at timestamp with time zone,
  confirmed_by text
);

-- Enable RLS on matches
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- Create predictions table
CREATE TABLE public.predictions (
  id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id text NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  home_goals integer NOT NULL,
  away_goals integer NOT NULL,
  man_of_the_match text NOT NULL,
  motm_photo_url text,
  bonus_answer text NOT NULL,
  submitted_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_locked boolean NOT NULL DEFAULT false,
  points_earned integer,
  breakdown jsonb DEFAULT '{"result": 0, "exactScore": 0, "motm": 0, "bonus": 0}'::jsonb
);

-- Enable RLS on predictions
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create leaderboard table
CREATE TABLE public.leaderboard (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  photo_url text,
  total_points integer DEFAULT 0,
  breakdown jsonb DEFAULT '{"exactScores": 0, "correctResults": 0, "motmCorrect": 0, "bonusCorrect": 0}'::jsonb,
  predictions_count integer DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on leaderboard
ALTER TABLE public.leaderboard ENABLE ROW LEVEL SECURITY;

-- Create admin_results table
CREATE TABLE public.admin_results (
  match_id text PRIMARY KEY REFERENCES public.matches(id) ON DELETE CASCADE,
  final_score jsonb NOT NULL,
  winner text NOT NULL,
  man_of_the_match text NOT NULL,
  bonus_answer text NOT NULL,
  confirmed_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  confirmed_by text NOT NULL
);

-- Enable RLS on admin_results
ALTER TABLE public.admin_results ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Profiles policies
CREATE POLICY select_profiles ON public.profiles 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY insert_profile ON public.profiles 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY update_profiles ON public.profiles 
  FOR UPDATE TO authenticated USING (auth.uid() = id OR public.is_admin(auth.uid()));

CREATE POLICY admin_profiles ON public.profiles 
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Matches policies
CREATE POLICY select_matches ON public.matches 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_matches ON public.matches 
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Predictions policies
CREATE POLICY select_predictions ON public.predictions 
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR 
    public.is_admin(auth.uid()) OR 
    (SELECT confirmed FROM public.matches WHERE id = match_id) = true
  );

CREATE POLICY insert_predictions ON public.predictions 
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = user_id AND 
    (SELECT is_active FROM public.profiles WHERE id = auth.uid()) = true AND 
    (SELECT kickoff_time FROM public.matches WHERE id = match_id) > now() AND 
    points_earned IS NULL
  );

CREATE POLICY update_predictions ON public.predictions 
  FOR UPDATE TO authenticated USING (
    auth.uid() = user_id AND 
    (SELECT is_active FROM public.profiles WHERE id = auth.uid()) = true AND 
    (SELECT kickoff_time FROM public.matches WHERE id = match_id) > now()
  ) WITH CHECK (
    points_earned IS NULL OR points_earned = (SELECT points_earned FROM public.predictions WHERE id = id)
  );

CREATE POLICY admin_predictions ON public.predictions 
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Leaderboard policies
CREATE POLICY select_leaderboard ON public.leaderboard 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_leaderboard ON public.leaderboard 
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Admin Results policies
CREATE POLICY select_admin_results ON public.admin_results 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY admin_results_all ON public.admin_results 
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()));


-- ==========================================
-- AUTOMATIC SIGNUP TRIGGER FOR PROFILES & LEADERBOARD
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, name, email, photo_url, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Anonymous'),
    COALESCE(new.email, 'unknown@rit.ac.in'),
    new.raw_user_meta_data->>'avatar_url',
    (new.email = 'admin@rit.ac.in' OR new.email = 'bhagathkrishnan06@gmail.com')
  );
  
  -- Insert into leaderboard
  INSERT INTO public.leaderboard (user_id, name, email, photo_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', 'Anonymous'),
    COALESCE(new.email, 'unknown@rit.ac.in'),
    new.raw_user_meta_data->>'avatar_url'
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute function on new user insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
