import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

export interface DashboardMetrics {
  totalUsers: number;
  totalMessages: number;
  activeChatsLast24h: number;
  avgResponseTimeSeconds: number;
  usersDelta: number;
  messagesDelta: number;
}

export interface ChartDataPoint {
  day: string;
  count: number;
}

export interface HourActivityPoint {
  hour: number;
  count: number;
}

export interface ChatTypeBreakdown {
  label: string;
  value: number;
}

export interface TopRoom {
  name: string;
  messageCount: number;
}

export interface ReadRatioPoint {
  day: string;
  read_count: number;
  unread_count: number;
}

/**
 * Utility to calculate percentage change
 */
export const getDeltaPercent = (current: number, previous: number): number => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Number(((current - previous) / previous * 100).toFixed(1));
};

export const getTotalUsers = async (): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const { count, error } = await (supabase! as any)
    .from("profiles")
    .select("*", { count: "exact", head: true });
  
  if (error) throw error;
  return count || 0;
};

export const getTotalMessages = async (from: Date, to: Date): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const { count, error } = await (supabase! as any)
    .from("messages")
    .select("*", { count: "exact", head: true })
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());
  
  if (error) throw error;
  return count || 0;
};

export const getActiveChats = async (): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  const { data, error } = await (supabase! as any)
    .from("messages")
    .select("chat_id")
    .gte("created_at", yesterday.toISOString());
  
  if (error) throw error;
  
  const distinctChats = new Set((data as any[]).map(m => m.chat_id));
  return distinctChats.size;
};

export const getMessagesPerDay = async (days: number): Promise<ChartDataPoint[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase! as any).rpc("get_messages_per_day", { days_limit: days });
  if (error) throw error;
  return data as ChartDataPoint[];
};

export const getSignupsPerDay = async (days: number): Promise<ChartDataPoint[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase! as any).rpc("get_signups_per_day", { days_limit: days });
  if (error) throw error;
  return data as ChartDataPoint[];
};

export const getActiveUsersByHour = async (): Promise<HourActivityPoint[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase! as any).rpc("get_active_by_hour");
  if (error) throw error;
  return data as HourActivityPoint[];
};

export const getChatTypeBreakdown = async (): Promise<ChatTypeBreakdown[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase! as any)
    .from("chats")
    .select("is_group");
  
  if (error) throw error;
  
  const groups = (data as any[]).filter(c => c.is_group).length;
  const privates = data.length - groups;
  
  return [
    { label: "Group", value: groups },
    { label: "Private", value: privates }
  ];
};

export const getTopRooms = async (limit: number): Promise<TopRoom[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase! as any)
    .from("messages")
    .select(`
       chat_id,
       chats ( name, type )
    `);
  
  if (error) throw error;
  
  const counts: Record<string, { name: string, count: number }> = {};
  (data as any[]).forEach((m: any) => {
    const id = m.chat_id;
    if (!counts[id]) {
        counts[id] = { 
            name: m.chats?.name || (m.chats?.type === 'private' ? 'Direct Message' : 'Untitled Group'), 
            count: 0 
        };
    }
    counts[id].count++;
  });

  return Object.values(counts)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
    .map(c => ({ name: c.name, messageCount: c.count }));
};

export const getAvgResponseTime = async (): Promise<number> => {
  if (!isSupabaseConfigured) return 0;
  const { data, error } = await (supabase! as any).rpc("get_avg_response_time");
  if (error) throw error;
  return Number(data) || 0;
};

export const getReadRatioOverTime = async (days: number): Promise<ReadRatioPoint[]> => {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await (supabase! as any).rpc("get_read_ratio_over_time", { days_limit: days });
  if (error) throw error;
  return data as ReadRatioPoint[];
};
