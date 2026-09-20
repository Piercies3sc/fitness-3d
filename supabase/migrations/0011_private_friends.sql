-- Private friends: all cross-user visibility is restricted to the RPCs below.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format_check
  CHECK (username IS NULL OR username ~ '^[a-z0-9_]{3,20}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_unique
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX friendships_one_pair_unique
  ON public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
CREATE INDEX friendships_party_status_idx
  ON public.friendships (requester_id, addressee_id, status);

CREATE TABLE public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Friendship participants can read their relationship"
  ON public.friendships FOR SELECT TO authenticated
  USING ((select auth.uid()) IN (requester_id, addressee_id));

CREATE POLICY "Blockers can read their blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING ((select auth.uid()) = blocker_id);

REVOKE INSERT, UPDATE, DELETE ON public.friendships FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.user_blocks FROM anon, authenticated;
GRANT SELECT ON public.friendships, public.user_blocks TO authenticated;

CREATE OR REPLACE FUNCTION public.friends_current_user_id()
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  RETURN current_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.friends_are_blocked(p_one uuid, p_two uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER STABLE SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = p_one AND blocked_id = p_two)
       OR (blocker_id = p_two AND blocked_id = p_one)
  );
$$;

CREATE OR REPLACE FUNCTION public.search_users_for_friends(search_text text)
RETURNS TABLE(user_id uuid, username text, display_name text, relationship_state text)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
DECLARE query_text text := lower(trim(search_text));
BEGIN
  IF length(query_text) < 2 THEN RETURN; END IF;
  RETURN QUERY
  SELECT p.id, p.username, p.display_name,
    COALESCE((SELECT f.status FROM public.friendships f
      WHERE (f.requester_id = current_user_id AND f.addressee_id = p.id)
         OR (f.requester_id = p.id AND f.addressee_id = current_user_id)), 'none')
  FROM public.profiles p
  WHERE p.id <> current_user_id
    AND p.username IS NOT NULL
    AND p.username LIKE query_text || '%'
    AND NOT public.friends_are_blocked(current_user_id, p.id)
  ORDER BY p.username
  LIMIT 20;
END;
$$;

CREATE OR REPLACE FUNCTION public.send_friend_request(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  IF current_user_id = target_user_id THEN RAISE EXCEPTION 'Cannot add yourself'; END IF;
  IF public.friends_are_blocked(current_user_id, target_user_id) THEN RAISE EXCEPTION 'Relationship unavailable'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id AND username IS NOT NULL) THEN RAISE EXCEPTION 'User unavailable'; END IF;
  INSERT INTO public.friendships (requester_id, addressee_id)
  VALUES (current_user_id, target_user_id);
EXCEPTION WHEN unique_violation THEN RAISE EXCEPTION 'A relationship already exists';
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_friend_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  UPDATE public.friendships SET status = 'accepted', accepted_at = now(), updated_at = now()
  WHERE id = request_id AND addressee_id = current_user_id AND status = 'pending'
    AND NOT public.friends_are_blocked(requester_id, addressee_id);
  IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.decline_friend_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  DELETE FROM public.friendships WHERE id = request_id AND addressee_id = current_user_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.cancel_friend_request(request_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  DELETE FROM public.friendships WHERE id = request_id AND requester_id = current_user_id AND status = 'pending';
  IF NOT FOUND THEN RAISE EXCEPTION 'Request unavailable'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_friend(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  DELETE FROM public.friendships WHERE status = 'accepted'
    AND ((requester_id = current_user_id AND addressee_id = target_user_id)
      OR (requester_id = target_user_id AND addressee_id = current_user_id));
  IF NOT FOUND THEN RAISE EXCEPTION 'Friendship unavailable'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.block_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  IF current_user_id = target_user_id THEN RAISE EXCEPTION 'Cannot block yourself'; END IF;
  DELETE FROM public.friendships WHERE (requester_id = current_user_id AND addressee_id = target_user_id)
     OR (requester_id = target_user_id AND addressee_id = current_user_id);
  INSERT INTO public.user_blocks (blocker_id, blocked_id) VALUES (current_user_id, target_user_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
END;
$$;

CREATE OR REPLACE FUNCTION public.unblock_user(target_user_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  DELETE FROM public.user_blocks WHERE blocker_id = current_user_id AND blocked_id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_friends_overview()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE current_user_id uuid := public.friends_current_user_id();
BEGIN
  RETURN jsonb_build_object(
    'username', (SELECT username FROM public.profiles WHERE id = current_user_id),
    'incoming', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username, 'display_name', p.display_name)) FROM public.friendships f JOIN public.profiles p ON p.id = f.requester_id WHERE f.addressee_id = current_user_id AND f.status = 'pending'), '[]'::jsonb),
    'outgoing', COALESCE((SELECT jsonb_agg(jsonb_build_object('id', f.id, 'user_id', p.id, 'username', p.username, 'display_name', p.display_name)) FROM public.friendships f JOIN public.profiles p ON p.id = f.addressee_id WHERE f.requester_id = current_user_id AND f.status = 'pending'), '[]'::jsonb),
    'friends', COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username, 'display_name', p.display_name)) FROM public.friendships f JOIN public.profiles p ON p.id = CASE WHEN f.requester_id = current_user_id THEN f.addressee_id ELSE f.requester_id END WHERE current_user_id IN (f.requester_id, f.addressee_id) AND f.status = 'accepted'), '[]'::jsonb),
    'blocked', COALESCE((SELECT jsonb_agg(jsonb_build_object('user_id', p.id, 'username', p.username, 'display_name', p.display_name)) FROM public.user_blocks b JOIN public.profiles p ON p.id = b.blocked_id WHERE b.blocker_id = current_user_id), '[]'::jsonb)
  );
END;
$$;

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

REVOKE ALL ON FUNCTION public.friends_current_user_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.friends_are_blocked(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_users_for_friends(text), public.send_friend_request(uuid), public.accept_friend_request(uuid), public.decline_friend_request(uuid), public.cancel_friend_request(uuid), public.remove_friend(uuid), public.block_user(uuid), public.unblock_user(uuid), public.get_friends_overview(), public.get_friend_training_profile(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_users_for_friends(text), public.send_friend_request(uuid), public.accept_friend_request(uuid), public.decline_friend_request(uuid), public.cancel_friend_request(uuid), public.remove_friend(uuid), public.block_user(uuid), public.unblock_user(uuid), public.get_friends_overview(), public.get_friend_training_profile(text) TO authenticated;
