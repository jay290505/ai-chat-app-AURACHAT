import { create } from "zustand";
import { 
  DashboardMetrics, 
  ChartDataPoint, 
  HourActivityPoint, 
  ChatTypeBreakdown, 
  TopRoom,
  getTotalUsers,
  getTotalMessages,
  getActiveChats,
  getMessagesPerDay,
  getSignupsPerDay,
  getActiveUsersByHour,
  getChatTypeBreakdown,
  getTopRooms,
  getAvgResponseTime,
  getDeltaPercent,
  ReadRatioPoint,
  getReadRatioOverTime
} from "@/lib/adminStats";

export type AdminRange = '7d' | '30d' | '90d';

export interface DashboardActivity {
  id: string;
  type: 'new_user' | 'message_milestone' | 'group_created';
  text: string;
  timestamp: string;
}

interface AdminData {
  metrics: DashboardMetrics;
  messagesData: ChartDataPoint[];
  signupsData: ChartDataPoint[];
  hourlyActivity: HourActivityPoint[];
  typeBreakdown: ChatTypeBreakdown[];
  topRooms: TopRoom[];
  readRatioData: ReadRatioPoint[];
}

interface AdminState {
  range: AdminRange;
  data: AdminData | null;
  recentActivity: DashboardActivity[];
  loading: boolean;
  error: string | null;

  setRange: (range: AdminRange) => void;
  setMetrics: (data: AdminData) => void;
  appendActivity: (activity: DashboardActivity) => void;
}

export const useAdminStore = create<AdminState>()((set, get) => ({
  range: '7d',
  data: null,
  recentActivity: [],
  loading: false,
  error: null,

  setRange: (range: AdminRange) => set({ range }),

  setMetrics: (data: AdminData) => set({ data, loading: false, error: null }),

  appendActivity: (activity: DashboardActivity) => {
    const current = get().recentActivity;
    const exists = current.some(a => a.id === activity.id);
    if (exists) return;

    set({
      recentActivity: [activity, ...current].slice(0, 20)
    });
  }
}));
