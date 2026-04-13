"use client";

import { useNotificationStore } from "@/store/notificationStore";
import { useEffect, useState } from "react";

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
      {notifications.map((n) => (
        <div
          key={n.id}
          className="pointer-events-auto flex w-80 translate-x-0 animate-slide-left overflow-hidden rounded-2xl border border-white/10 bg-navy-deep/90 p-4 backdrop-blur-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all theme-light:bg-white theme-light:border-indigo-100"
        >
          <div className="absolute inset-y-0 left-0 w-1 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
          
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                {n.type === "message" ? "New Aura Message" : n.type === "group" ? "Added to Group" : "Aura System"}
              </span>
              <button 
                onClick={() => removeNotification(n.id)}
                className="text-white/40 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <h4 className="text-sm font-bold text-white">{n.title}</h4>
            <p className="text-xs text-slate-400 line-clamp-2">{n.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
