-- 1. Add is_group to chats (Aura Messenger uses 'chats' table name)
ALTER TABLE public.chats ADD COLUMN IF NOT EXISTS is_group BOOLEAN DEFAULT false;

-- Update is_group based on existing type
UPDATE public.chats SET is_group = true WHERE type = 'group';
UPDATE public.chats SET is_group = false WHERE type = 'private';

-- 2. Create get_messages_per_day(days int)
CREATE OR REPLACE FUNCTION get_messages_per_day(days_limit int)
RETURNS TABLE (day date, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('day', created_at)::date as day,
        count(*) as count
    FROM public.messages
    WHERE created_at > now() - (days_limit || ' days')::interval
    GROUP BY 1
    ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create get_signups_per_day(days int)
CREATE OR REPLACE FUNCTION get_signups_per_day(days_limit int)
RETURNS TABLE (day date, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('day', created_at)::date as day,
        count(*) as count
    FROM public.profiles
    WHERE created_at > now() - (days_limit || ' days')::interval
    GROUP BY 1
    ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create get_active_by_hour()
CREATE OR REPLACE FUNCTION get_active_by_hour()
RETURNS TABLE (hour double precision, count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_part('hour', created_at) as hour,
        count(*) as count
    FROM public.messages
    WHERE created_at > now() - interval '24 hours'
    GROUP BY 1
    ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create get_avg_response_time()
CREATE OR REPLACE FUNCTION get_avg_response_time()
RETURNS double precision AS $$
DECLARE
    avg_seconds double precision;
BEGIN
    SELECT AVG(EXTRACT(EPOCH FROM (next_msg_time - created_at)))
    INTO avg_seconds
    FROM (
        SELECT 
            created_at,
            LEAD(created_at) OVER (PARTITION BY chat_id ORDER BY created_at) as next_msg_time
        FROM public.messages
        WHERE created_at > now() - interval '7 days'
    ) diffs
    WHERE next_msg_time IS NOT NULL 
    AND (next_msg_time - created_at) < interval '1 hour'; -- Exclude long gaps (conversations restart)
    
    RETURN COALESCE(avg_seconds, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create get_read_ratio_over_time(days int)
CREATE OR REPLACE FUNCTION get_read_ratio_over_time(days_limit int)
RETURNS TABLE (day date, read_count bigint, unread_count bigint) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        date_trunc('day', created_at)::date as day,
        COALESCE(count(*) filter (where status = 'seen'), 0) as read_count,
        COALESCE(count(*) filter (where status != 'seen'), 0) as unread_count
    FROM public.messages
    WHERE created_at > now() - (days_limit || ' days')::interval
    GROUP BY 1
    ORDER BY 1 ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
