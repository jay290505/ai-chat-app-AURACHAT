"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area
} from "recharts";
import { 
  Users, 
  MessageCircle, 
  Activity, 
  Clock, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar,
  Settings,
  Bell,
  Search,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  RefreshCcw,
  Sparkles
} from "lucide-react";
import { useAdminStats } from "@/hooks/useAdminStats";
import { useAdminStore, AdminRange } from "@/store/adminStore";
import { supabase, isSupabaseConfigured } from "@/lib/supabaseClient";

// --- Components ---

const MetricCard = ({ title, value, delta, icon: Icon, unit = "" }: any) => {
  const isPositive = delta > 0;
  return (
    <div className="bg-[var(--navy-light)] border border-white/5 rounded-3xl p-6 shadow-xl relative overflow-hidden group hover:border-indigo-500/30 transition-all duration-500">
      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-[40px] rounded-full -mr-8 -mt-8" />
      <div className="flex justify-between items-start mb-4">
        <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform duration-500">
          <Icon className="w-6 h-6" />
        </div>
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
          {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {Math.abs(delta)}%
        </div>
      </div>
      <div>
        <p className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-black text-white tracking-tight">
          {value.toLocaleString()}{unit}
        </h3>
      </div>
    </div>
  );
};

const ChartContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-[var(--navy-light)] border border-white/5 rounded-[2rem] p-8 shadow-xl hover:border-white/10 transition-colors h-[400px] flex flex-col">
    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
      <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
      {title}
    </h3>
    <div className="flex-1 w-full min-h-0">
      {children}
    </div>
  </div>
);

type CustomTooltipProps = {
  active?: boolean;
  payload?: Array<{
    color?: string;
    name?: string;
    value?: number | string;
  }>;
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[var(--navy-light)] border border-white/10 p-4 rounded-xl shadow-2xl backdrop-blur-md">
        <p className="text-white font-bold mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: <span className="text-white font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Page ---

export default function AdminDashboard() {
  const router = useRouter();
  const range = useAdminStore(s => s.range);
  const setRange = useAdminStore(s => s.setRange);
  const { data, loading, error, refresh } = useAdminStats(range);
  const recentActivity = useAdminStore(s => s.recentActivity);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!isSupabaseConfigured) {
        setIsAdmin(true);
        return;
      }
      const { data: { session } } = await supabase!.auth.getSession();
      if (!session) {
        router.push("/signin");
        return;
      }
      const email = session.user.email;
      const role = session.user.user_metadata?.role || session.user.app_metadata?.role;
      // Allow by role OR by admin email
      if (role === 'admin' || email === 'jayjobanputra083@gmail.com') {
        setIsAdmin(true);
      } else {
        router.push("/");
      }
    }
    checkAdmin();
  }, [router]);

  if (isAdmin === null) return <div className="min-h-screen bg-[var(--background)] flex items-center justify-center"><Zap className="w-12 h-12 text-indigo-500 animate-pulse" /></div>;

  const COLORS = ['#6366f1', '#ec4899', '#8b5cf6', '#f59e0b', '#10b981'];

  return (
    <div className="min-h-screen bg-[var(--background)] text-zinc-50 font-sans selection:bg-indigo-500/30 pb-20">
      {/* Background Decor */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-indigo-950/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40vw] h-[40vw] bg-purple-950/10 blur-[120px] rounded-full" />
      </div>

      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-[var(--background)]/80 backdrop-blur-2xl border-b border-white/5 px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
             <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">Aura <span className="text-indigo-400">Admin</span></h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-none mt-0.5">Control Center</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/5 p-1 rounded-2xl">
          {(['7d', '30d', '90d'] as AdminRange[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${range === r ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-6">
           <p className="text-sm font-bold text-zinc-400 hidden lg:block">
             {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
           </p>
           <button onClick={() => refresh()} className="p-2.5 rounded-xl border border-white/5 hover:bg-white/5 transition-colors text-zinc-400 hover:text-white">
             <RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
           </button>
           <div className="h-10 w-10 rounded-full border border-indigo-500/20 bg-indigo-500/10 flex items-center justify-center overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-colors">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
           </div>
        </div>
      </nav>

      {/* Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-8 pt-12 space-y-12">
        {/* Metric Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard title="Total Users" value={data?.metrics?.totalUsers || 0} delta={data?.metrics?.usersDelta || 0} icon={Users} />
          <MetricCard title="Messages Sent" value={data?.metrics?.totalMessages || 0} delta={data?.metrics?.messagesDelta || 0} icon={MessageCircle} />
          <MetricCard title="Active Chats" value={data?.metrics?.activeChatsLast24h || 0} delta={12.5} icon={Activity} />
          <MetricCard title="Avg Response" value={Math.round(data?.metrics?.avgResponseTimeSeconds || 0)} delta={-8.4} icon={Clock} unit="s" />
        </section>

        {/* Double Column Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <ChartContainer title="Messages Per Day">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data?.messagesData || []}>
                    <defs>
                      <linearGradient id="colorMsg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: string) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} />
                    <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="count" name="Messages" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorMsg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
           </div>
           <div>
              <ChartContainer title="Private vs Group">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                     <Pie
                       data={data?.typeBreakdown || [{label: 'Loading', value: 1}]}
                       cx="50%"
                       cy="50%"
                       innerRadius={70}
                       outerRadius={90}
                       paddingAngle={10}
                       dataKey="value"
                       nameKey="label"
                       stroke="none"
                     >
                       {(data?.typeBreakdown || []).map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                       ))}
                     </Pie>
                     <Tooltip content={<CustomTooltip />} />
                   </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                   {(data?.typeBreakdown || []).map((entry: any, index: number) => (
                     <div key={index} className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                       <span className="text-xs font-bold text-zinc-400">{entry.label}</span>
                     </div>
                   ))}
                </div>
              </ChartContainer>
           </div>
        </div>

        {/* Signups and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           <ChartContainer title="New Signups">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.signupsData || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="day" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val: string) => new Date(val).toLocaleDateString(undefined, {day: 'numeric'})} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                  <Bar dataKey="count" name="Users" fill="#ec4899" radius={[6, 6, 0, 0]} />
                </BarChart>
             </ResponsiveContainer>
           </ChartContainer>

           <ChartContainer title="Hourly Engagement (Last 24h)">
             <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.hourlyActivity || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="hour" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(h: number) => `${h}h`} />
                  <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.03)'}} />
                  <Bar dataKey="count" name="Activities" radius={[4, 4, 0, 0]}>
                    {(data?.hourlyActivity || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.count > 50 ? '#8b5cf6' : '#6366f1'} opacity={entry.count > 50 ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
           </ChartContainer>
        </div>

        {/* Read Ratio and Top Rooms */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <ChartContainer title="Read vs Unread Efficiency">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.readRatioData || []}>
                       <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" />
                       <XAxis dataKey="day" stroke="#71717a" fontSize={10} tickFormatter={(val: string) => val.split('-').slice(1).join('/')} />
                       <YAxis stroke="#71717a" fontSize={10} />
                       <Tooltip content={<CustomTooltip />} />
                       <Area type="monotone" dataKey="read_count" stackId="1" name="Read" stroke="#10b981" fill="#10b98133" />
                       <Area type="monotone" dataKey="unread_count" stackId="1" name="Unread" stroke="#f43f5e" fill="#f43f5e33" />
                    </AreaChart>
                 </ResponsiveContainer>
              </ChartContainer>
           </div>
           
           <ChartContainer title="Top Rooms by Volume">
              <div className="space-y-6 mt-4 overflow-y-auto pr-2">
                 {(data?.topRooms || []).map((room, i) => (
                   <div key={i} className="flex items-center justify-between group cursor-default">
                      <div className="flex items-center gap-4">
                         <div className="h-10 w-10 min-w-[40px] rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                            {i + 1}
                         </div>
                         <div>
                            <p className="font-bold text-white text-sm line-clamp-1">{room.name}</p>
                            <div className="w-24 h-1.5 bg-white/5 rounded-full mt-1.5">
                               <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (room.messageCount / ((data?.topRooms[0]?.messageCount || 1) / 100)))}%` }} />
                            </div>
                         </div>
                      </div>
                      <p className="font-black text-indigo-400 text-sm">{room.messageCount}</p>
                   </div>
                 ))}
                 {!data?.topRooms?.length && <p className="text-zinc-500 text-center py-10">No chat data yet</p>}
              </div>
           </ChartContainer>
        </div>

        {/* Bottom Activity Feed */}
        <section className="bg-[var(--navy-light)] border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="px-10 py-8 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
             <h3 className="text-xl font-black text-white flex items-center gap-3">
               <Sparkles className="w-5 h-5 text-amber-400" />
               Platform Realtime Activity
             </h3>
             <span className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20 animate-pulse">
               Live
             </span>
          </div>
          <div className="max-h-[500px] overflow-y-auto scrollbar-hide">
             {recentActivity.length > 0 ? (
               recentActivity.map((activity, i) => (
                 <div key={activity.id} className={`flex items-center justify-between px-10 py-6 hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] ${i === 0 ? 'bg-indigo-500/[0.03]' : ''}`}>
                    <div className="flex items-center gap-6">
                       <div className={`p-3 rounded-2xl ${
                         activity.type === 'new_user' ? 'bg-indigo-500/10 text-indigo-400' : 
                         activity.type === 'group_created' ? 'bg-purple-500/10 text-purple-400' : 
                         'bg-emerald-500/10 text-emerald-400'
                       }`}>
                          {activity.type === 'new_user' ? <Users className="w-5 h-5" /> : <MessageCircle className="w-5 h-5" />}
                       </div>
                       <div>
                          <p className="text-white font-bold tracking-tight">{activity.text}</p>
                          <p className="text-xs text-zinc-500 font-medium mt-1 uppercase tracking-widest">
                            {activity.type.replace('_', ' ')}
                          </p>
                       </div>
                    </div>
                    <time className="text-sm font-bold text-zinc-600">
                       {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </time>
                 </div>
               ))
             ) : (
               <div className="py-20 text-center flex flex-col items-center">
                  <Activity className="w-12 h-12 text-zinc-800 mb-4" />
                  <p className="text-zinc-600 font-bold">Waiting for platform events...</p>
               </div>
             )}
          </div>
        </section>
      </main>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
