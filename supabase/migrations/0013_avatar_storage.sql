-- Migration: 0013_avatar_storage.sql
-- Description: Add avatar_path to profiles, configure private avatars bucket and RLS policies, update friends RPCs

-- 1. Add avatar_path column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_path TEXT;

-- 2. Create private storage bucket 'avatars'
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  false,
  2097152, -- 2 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. Storage RLS policies for avatars bucket
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (select auth.uid()::text)
  );

DROP POLICY IF EXISTS "Users and accepted friends can read avatars" ON storage.objects;
CREATE POLICY "Users and accepted friends can read avatars"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = (select auth.uid()::text)
      OR EXISTS (
        SELECT 1 FROM public.friendships
        WHERE status = 'accepted'
          AND (
            (requester_id = (select auth.uid()) AND addressee_id::text = (storage.foldername(name))[1])
            OR
            (addressee_id = (select auth.uid()) AND requester_id::text = (storage.foldername(name))[1])
          )
      )
    )
  );

-- 4. Update get_friends_overview RPC to include avatar_path
CREATE OR REPLACE FUNCTION public.get_friends_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  RETURN jsonb_build_object(
    'username', (SELECT username FROM public.profiles WHERE id = current_user_id),
    'incoming', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path)) FROM public.friendships f JOIN public.profiles p ON p.id = f.requester_id WHERE f.addressee_id = current_user_id AND f.status = 'pending'), '[]'::jsonb),
    'outgoing', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path)) FROM public.friendships f JOIN public.profiles p ON p.id = f.addressee_id WHERE f.requester_id = current_user_id AND f.status = 'pending'), '[]'::jsonb),
    'friends', COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path)) FROM public.friendships f JOIN public.profiles p ON p.id = CASE WHEN f.requester_id = current_user_id THEN f.addressee_id ELSE f.requester_id END WHERE current_user_id IN (f.requester_id, f.addressee_id) AND f.status = 'accepted'), '[]'::jsonb),
    'blocked', COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username, 'display_name', p.display_name, 'avatar_path', p.avatar_path)) FROM public.user_blocks b JOIN public.profiles p ON p.id = b.blocked_id WHERE b.blocker_id = current_user_id), '[]'::jsonb)
  );
END;
$$;

-- 5. Update get_friend_training_profile RPC to include avatar_path
CREATE OR REPLACE FUNCTION public.get_friend_training_profile(target_username text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
DECLARE target_id uuid;
BEGIN
  SELECT id INTO target_id FROM public.profiles WHERE username = lower(trim(target_username));
  IF target_id IS NULL OR NOT EXISTS (SELECT 1 FROM public.friendships WHERE status = 'accepted' AND ((requester_id = current_user_id AND addressee_id = target_id) OR (requester_id = target_id AND addressee_id = current_user_id))) OR public.friends_are_blocked(current_user_id, target_id) THEN RAISE EXCEPTION 'Friend profile unavailable'; END IF;
  RETURN jsonb_build_object(
    'display_name', (SELECT display_name FROM public.profiles WHERE id = target_id),
    'username', (SELECT username FROM public.profiles WHERE id = target_id),
    'avatar_path', (SELECT avatar_path FROM public.profiles WHERE id = target_id),
    'overview', jsonb_build_object(
      'workouts_this_week', (SELECT count(*) FROM public.workouts WHERE user_id = target_id AND status = 'completed' AND completed_at >= date_trunc('week', now())),
      'total_workouts', (SELECT count(*) FROM public.workouts WHERE user_id = target_id AND status = 'completed'),
      'working_sets', (SELECT count(*) FROM public.workout_sets ws JOIN public.workout_exercises we ON we.id = ws.workout_exercise_id JOIN public.workouts w ON w.id = we.workout_id WHERE w.user_id = target_id AND w.status = 'completed' AND ws.set_type = 'working'),
      'routine_count', (SELECT count(*) FROM public.routines WHERE user_id = target_id)
    ),
    'recent_workouts', COALESCE((SELECT jsonb_agg(item) FROM (SELECT jsonb_build_object('name', routine_name_snapshot, 'completed_at', completed_at) item FROM public.workouts WHERE user_id = target_id AND status = 'completed' ORDER BY completed_at DESC LIMIT 3) x), '[]'::jsonb),
    'recent_prs', COALESCE((SELECT jsonb_agg(item) FROM (
      SELECT jsonb_build_object('exercise_name', exercise_name, 'weight_kg', weight_kg, 'completed_at', completed_at) item
      FROM (
        SELECT e.name AS exercise_name, ws.weight_kg, w.completed_at,
          max(ws.weight_kg) OVER (PARTITION BY we.exercise_id ORDER BY w.completed_at, ws.completed_at ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING) AS prior_best
        FROM public.workout_sets ws
        JOIN public.workout_exercises we ON we.id = ws.workout_exercise_id
        JOIN public.workouts w ON w.id = we.workout_id
        JOIN public.exercises e ON e.id = we.exercise_id
        WHERE w.user_id = target_id AND w.status = 'completed' AND ws.set_type = 'working'
      ) pr_candidates
      WHERE prior_best IS NULL OR weight_kg > prior_best
      ORDER BY completed_at DESC LIMIT 5
    ) x), '[]'::jsonb),
    'top_muscles', COALESCE((SELECT jsonb_agg(item) FROM (SELECT jsonb_build_object('name', m.name, 'exposure', round(sum(em.exposure_factor)::numeric, 1)) item FROM public.workout_sets ws JOIN public.workout_exercises we ON we.id = ws.workout_exercise_id JOIN public.workouts w ON w.id = we.workout_id JOIN public.exercise_muscles em ON em.exercise_id = we.exercise_id JOIN public.muscles m ON m.id = em.muscle_id WHERE w.user_id = target_id AND w.status = 'completed' AND ws.set_type = 'working' AND ws.completed_at >= now() - interval '30 days' GROUP BY m.id, m.name ORDER BY sum(em.exposure_factor) DESC LIMIT 5) x), '[]'::jsonb)
  );
END;
$$;
