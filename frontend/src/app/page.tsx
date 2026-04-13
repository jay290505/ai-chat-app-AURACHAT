"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRouter } from "next/navigation";
import { Shield, Zap, Sparkles, ArrowRight, Github, Bot, Lock as LucideLock, Globe, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { useSettingsStore } from "@/store/settingsStore";
import { useAuthStore } from "@/store/authStore";

// Performance-optimized components without heavy recalculation nodes

type Testimonial = {
  text: string;
  author: string;
  role: string;
};

const TESTIMONIALS: Testimonial[] = [
  { text: "Aura is the fastest chat app I've ever used. The Gemini AI integration is literally mind-blowing.", author: "Sarah J.", role: "Product Manager" },
  { text: "We moved our entire team from Slack to Aura. The latency is practically zero.", author: "Michael T.", role: "CTO" },
  { text: "The Groq AI context engine completely changed how I communicate with global clients.", author: "Elena R.", role: "Freelance Designer" },
  { text: "Absolutely stunning UI and the quantum-grade encryption gives me total peace of mind.", author: "David K.", role: "Security Analyst" },
  { text: "I can't believe this is free. The smart replies are so accurate they finish my sentences.", author: "Alex W.", role: "Software Engineer" },
  { text: "Aura's realtime sync is flawless. Best communication platform of 2026.", author: "Jessica M.", role: "Remote Worker" },
  { text: "The sheer minimalist UI keeps distractions away. A breath of fresh air.", author: "Chris L.", role: "Art Director" },
  { text: "Blazing fast global edge deployment. It feels like everyone is in the same room.", author: "Amanda P.", role: "DevOps Engineer" }
];

const TestimonialCard = ({ item }: { item: Testimonial }) => (
  <div className="w-[85vw] max-w-[450px] shrink-0 rounded-3xl border border-white/5 bg-white/[0.03] p-6 sm:w-[420px] sm:p-8 lg:w-[450px] hover:bg-white/[0.05] hover:border-white/10 transition-colors shadow-xl">
      <div className="flex items-center gap-1 mb-6 text-amber-400">
        {[...Array(5)].map((_, j) => <svg key={j} className="w-4 h-4 fill-current drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>)}
      </div>
    <p className="text-zinc-300 font-medium mb-8 text-base sm:text-lg leading-[1.6]">&quot;{item.text}&quot;</p>
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 p-px shadow-lg shadow-indigo-500/20">
           <div className="h-full w-full rounded-full bg-[var(--navy-deep)] flex items-center justify-center font-black text-white text-lg">
             {item.author.charAt(0)}
           </div>
        </div>
        <div>
          <h4 className="text-white font-bold tracking-wide">{item.author}</h4>
          <p className="text-indigo-400/80 text-xs uppercase tracking-widest font-bold mt-0.5">{item.role}</p>
        </div>
      </div>
   </div>
);

const InfiniteMarquee = ({ items, reverse = false, speed = 40 }: { items: Testimonial[]; reverse?: boolean; speed?: number }) => {
   return (
      <div 
        className="flex overflow-hidden relative group w-full py-4 -my-4"
        style={{ WebkitMaskImage: 'linear-gradient(to right, transparent, black 15%, black 85%, transparent)' }}
      >
         <motion.div 
            initial={{ x: reverse ? "-100%" : "0" }}
            animate={{ x: reverse ? "0" : "-100%" }}
            transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
            className="flex shrink-0 min-w-full items-center gap-4 px-2 sm:gap-6 sm:px-3 will-change-transform"
         >
            {items.map((item, i) => <TestimonialCard key={`first-${i}`} item={item} />)}
         </motion.div>
         <motion.div 
            initial={{ x: reverse ? "-100%" : "0" }}
            animate={{ x: reverse ? "0" : "-100%" }}
            transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
            className="flex shrink-0 min-w-full items-center gap-4 px-2 sm:gap-6 sm:px-3 will-change-transform"
         >
            {items.map((item, i) => <TestimonialCard key={`sec-${i}`} item={item} />)}
         </motion.div>
      </div>
   );
};

export default function LandingPage() {
  const router = useRouter();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -100]);
  const userId = useAuthStore(s => s.userId);
  const hydrateSettings = useSettingsStore(s => s.hydrate);

  useEffect(() => {
    if (userId) hydrateSettings(userId);
  }, [userId, hydrateSettings]);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[var(--background)] text-zinc-50 selection:bg-indigo-500/30 font-sans">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-900/10 blur-[150px]" />
      </div>

      {/* Navigation */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 z-50 w-full border-b border-white/5 bg-[var(--background)]/80 backdrop-blur-2xl"
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-6">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={() => router.push("/")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-500 group-hover:scale-105">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
    <span className="text-lg sm:text-xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-foreground to-zinc-400">Aura</span>
          </div>

          <div className="hidden items-center gap-10 md:flex">
            {["Features", "Technology", "Security", "About"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors duration-300 relative group">
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-indigo-400 transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => router.push("/signin")}
              className="hidden sm:block text-sm font-medium text-zinc-300 hover:text-white transition-colors px-4 py-2"
            >
              Sign In
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="group relative flex items-center justify-center overflow-hidden rounded-full bg-white px-4 py-2 text-xs font-semibold text-zinc-900 transition-all hover:scale-105 active:scale-95 sm:px-6 sm:py-2.5 sm:text-sm"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <main className="relative z-10 px-4 pb-20 pt-28 sm:px-6 sm:pb-28 sm:pt-36 lg:pb-32 lg:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-10 sm:gap-12 lg:flex-row lg:gap-16">
            
            {/* Hero Content */}
            <motion.div 
              style={{ y: y1 }}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-1.5 backdrop-blur-md"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                </span>
                <span className="text-xs font-semibold tracking-wide text-indigo-300">Aura AI 2.0 is now live</span>
              </motion.div>

              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mb-6 text-4xl font-extrabold tracking-tight leading-[1.05] text-white sm:mb-8 sm:text-6xl lg:text-[5.5rem]"
              >
                Communication, <br className="hidden lg:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">elevated by AI.</span>
              </motion.h1>

              <motion.p 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="mx-auto mb-10 max-w-2xl text-base leading-relaxed text-zinc-400 font-medium sm:mb-12 sm:text-xl lg:mx-0"
              >
                Experience the next generation of messaging. Real-time sub-millisecond sync, quantum-grade encryption, and built-in AI intelligence—wrapped in a breathtaking interface.
              </motion.p>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.5 }}
                className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start"
              >
                <button
                  onClick={() => router.push("/chat")}
                  className="group relative flex h-14 w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-8 text-sm font-semibold text-zinc-900 transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_rgba(99,102,241,0.3)] hover:shadow-[0_0_60px_rgba(99,102,241,0.5)]"
                >
                  Launch App
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
                <button 
                  onClick={() => router.push("/signup")}
                  className="group flex h-14 w-full sm:w-auto items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 text-sm font-semibold text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                >
                  Create free account
                </button>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div 
              style={{ y: y2 }}
              initial={{ opacity: 0, scale: 0.9, rotateX: 20 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative hidden flex-1 perspective-1000 md:block"
            >
              <div className="group relative mx-auto aspect-square w-full max-w-[420px] lg:max-w-[500px]">
                {/* Main UI Mockup */}
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-3xl border border-white/10 bg-[var(--navy-light)] p-6 shadow-2xl flex flex-col gap-4 transform rotate-y-[-10deg] rotate-x-[5deg] group-hover:rotate-0 transition-transform duration-700"
                >
                  {/* Mock Header */}
                  <div className="flex items-center gap-4 pb-4 border-b border-white/5">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <Sparkles className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Aura AI</h3>
                      <p className="text-xs text-emerald-400">Online</p>
                    </div>
                  </div>
                  
                  {/* Mock Messages */}
                  <div className="flex-1 space-y-4 overflow-hidden pt-2">
                    <div className="flex gap-3 max-w-[80%]">
                       <div className="h-8 w-8 rounded-full bg-[var(--navy-light)] shrink-0" />
                       <div className="bg-[var(--navy-light)] p-3 rounded-2xl rounded-tl-sm text-sm text-zinc-300">
                         Hey! Summarize my latest project updates.
                       </div>
                    </div>
                    <div className="flex gap-3 max-w-[85%] ml-auto rotate-[-1deg]">
                       <div className="bg-indigo-600 p-4 rounded-2xl rounded-tr-sm text-sm text-white shadow-lg shadow-indigo-500/20">
                         <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="h-4 w-4 text-indigo-200" />
                            <span className="font-semibold">Project Summary</span>
                         </div>
                         <p className="text-indigo-50">You have completed 3 major milestones today. Performance increased by 40%.</p>
                       </div>
                    </div>
                  </div>
                  
                  {/* Mock Input */}
                  <div className="mt-auto pt-4 relative">
                    <div className="h-12 w-full rounded-xl bg-[var(--navy-light)] border border-white/5 flex items-center px-4 justify-between">
                      <span className="text-zinc-500 text-sm">Ask Aura anything...</span>
                      <div className="h-6 w-6 rounded-md bg-white/10" />
                    </div>
                  </div>
                </motion.div>
                
                {/* Floating Elements */}
                <motion.div 
                   animate={{ y: [0, 15, 0] }}
                   transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                   className="absolute -right-6 top-16 rounded-2xl border border-white/10 bg-[var(--navy-light)] p-3 shadow-2xl lg:-right-12 lg:top-20 lg:p-4"
                >
                  <div className="flex items-center gap-3">
                    <Shield className="h-8 w-8 text-emerald-400" />
                    <div>
                      <p className="text-sm font-bold text-white">E2E Secure</p>
                      <p className="text-xs text-zinc-400">Military grade</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                   animate={{ y: [0, -20, 0] }}
                   transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                   className="absolute -left-6 bottom-20 rounded-2xl border border-white/10 bg-[var(--navy-light)] p-3 shadow-2xl lg:-left-16 lg:bottom-32 lg:p-4"
                >
                   <div className="flex flex-col gap-2">
                     <p className="text-xs font-semibold text-zinc-400">Latency</p>
                     <p className="text-2xl font-black text-white flex items-baseline gap-1">0.4 <span className="text-sm text-indigo-400">ms</span></p>
                   </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Bento Grid Features */}
      <section id="features" className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 md:text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">Everything you need to connect.</h2>
            <p className="mx-auto max-w-2xl text-base text-zinc-400 sm:text-lg">Meticulously engineered features designed to provide an unparalleled communication experience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Bento Card 1: AI */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04] md:col-span-2 sm:p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Bot className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">AI Context Engine</h3>
                  <p className="text-zinc-400 max-w-md">Our integrated Gemini models analyze context in real-time to provide smart replies, instant translations, and conversation summaries at the click of a button.</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 2: Security */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.1 }}
              id="security"
              className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04] scroll-mt-32 sm:p-8"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <LucideLock className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">Zero Trust</h3>
                  <p className="text-zinc-400">Military-grade encryption ensures your data remains exclusively yours, forever.</p>
                </div>
              </div>
            </motion.div>

            {/* Bento Card 3: Global */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.2 }}
              className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04] sm:p-8"
            >
               <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Globe className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">Global Sync</h3>
                  <p className="text-zinc-400">Deployed on the edge for sub-10ms latency worldwide.</p>
                </div>
              </div>
            </motion.div>

             {/* Bento Card 4: Lightning */}
             <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: 0.3 }}
              className="relative group overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.04] md:col-span-2 sm:p-8"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 h-full flex flex-col justify-between">
                <div>
                  <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <Zap className="h-6 w-6" />
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-white sm:text-2xl">Supabase Realtime</h3>
                  <p className="text-zinc-400 max-w-md">Built on modern WebSocket architecture ensuring instantaneous delivery and live presence indicators without battery drain.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Technology Section */}
      <section id="technology" className="relative z-10 px-4 py-20 scroll-mt-10 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 md:text-center">
            <div className="inline-flex items-center justify-center mb-4 roudned-full bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-widest backdrop-blur-md">
               <Globe className="w-4 h-4 mr-2" /> Global Stack
            </div>
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-white md:text-5xl">Powered by the Future.</h2>
            <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-zinc-400 sm:text-lg">A modern stack strictly engineered for extreme performance, limitless scaling, and unparalleled artificial intelligence.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {[
              { name: "Next.js", desc: "React Framework", icon: Globe },
              { name: "Supabase", desc: "Realtime DB", icon: Zap },
              { name: "Groq API", desc: "LPU Inference", icon: Bot },
              { name: "Gemini", desc: "AI Intelligence", icon: Sparkles }
            ].map((tech, i) => (
              <motion.div 
                key={tech.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[var(--navy-light)] p-5 shadow-2xl transition-colors hover:bg-white/[0.02] sm:p-8"
              >
                <div className="mb-5 p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-500 shadow-inner">
                  <tech.icon className="w-8 h-8" />
                </div>
                <h3 className="text-white font-bold text-lg">{tech.name}</h3>
                <p className="text-zinc-500 text-sm font-medium">{tech.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="relative z-10 border-y border-white/5 bg-white/[0.01] px-4 py-20 scroll-mt-10 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-center gap-10 md:grid-cols-2 md:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-zinc-300 font-semibold text-xs uppercase tracking-widest mb-6 shadow-sm">
              <Sparkles className="w-4 h-4 text-purple-400" /> Our Mission
            </div>
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-5xl md:leading-tight">
              Redefining how humans connect online.
            </h2>
            <p className="mb-8 text-base leading-relaxed text-zinc-400 font-medium sm:text-lg lg:leading-[1.8]">
              Aura was born from a simple belief: communication should be completely effortless, ironclad secure, and deeply intelligent. 
              We&apos;ve entirely stripped away the visual clutter of legacy platforms to deliver a sheer, minimalist experience that strictly gets out of your way and lets the conversation flow organically.
            </p>
            <div className="flex flex-col gap-5">
               {["Privacy first, always secured.", "Designed meticulously for humans.", "Built exclusively for extreme speed."].map(item => (
                 <div key={item} className="flex items-center gap-4">
                   <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <span className="font-semibold tracking-wide text-zinc-200">{item}</span>
                 </div>
               ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative mt-4 md:mt-0"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 blur-[100px] rounded-full" />
            <div className="relative rounded-[2rem] border border-white/10 overflow-hidden bg-[var(--navy-light)] backdrop-blur-3xl shadow-2xl">
              <div className="flex gap-4 border-b border-white/10 bg-white/[0.01] p-5 sm:p-8">
                 <div className="flex-1">
                   <p className="mb-2 cursor-default text-3xl leading-none text-white font-black sm:text-4xl lg:text-5xl">1.4<span className="text-indigo-400">M</span></p>
                   <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Messages Daily</p>
                 </div>
                 <div className="w-px bg-white/10 mx-2" />
                 <div className="flex-1">
                   <p className="mb-2 cursor-default text-3xl leading-none text-white font-black sm:text-4xl lg:text-5xl">0.4<span className="text-2xl text-indigo-400 sm:text-3xl">ms</span></p>
                   <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.2em]">Avg Latency</p>
                 </div>
              </div>
              <div className="p-2">
                <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" alt="Team" className="pointer-events-none h-48 w-full rounded-[1.5rem] object-cover opacity-70 mix-blend-luminosity transition-all duration-700 hover:opacity-100 hover:mix-blend-normal sm:h-64" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Customer Ratings Section */}
      <section className="relative z-10 overflow-hidden border-t border-white/5 bg-[var(--background)] py-20 sm:py-24 lg:py-32">
        <div className="mx-auto mb-16 max-w-7xl px-4 md:text-center sm:px-6 sm:mb-20">
            <h2 className="mb-6 text-3xl font-bold tracking-tight text-white md:text-5xl">Loved by visionaries.</h2>
            <p className="mx-auto max-w-2xl text-base font-medium leading-relaxed text-zinc-400 sm:text-lg">See what our community of elite engineers, designers, and remote teams are saying about their Aura experience.</p>
        </div>
        
        <div className="flex w-full flex-col gap-6 -rotate-[0.5deg] scale-[1.02] sm:gap-8 sm:-rotate-1 sm:scale-105">
           <InfiniteMarquee items={TESTIMONIALS.slice(0, 4)} speed={50} />
           <InfiniteMarquee items={TESTIMONIALS.slice(4, 8)} speed={60} reverse={true} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 px-4 py-20 sm:px-6 sm:py-24 lg:py-32">
        <div className="mx-auto max-w-5xl rounded-[2rem] bg-gradient-to-br from-indigo-500/30 via-purple-500/30 to-transparent p-1 shadow-2xl sm:rounded-[3rem]">
           <div className="relative overflow-hidden rounded-[calc(2rem-4px)] bg-[var(--navy-light)] px-5 py-16 text-center sm:rounded-[calc(3rem-4px)] sm:px-6 sm:py-24">
             
             {/* Decor inner */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-indigo-500/20 blur-[100px] pointer-events-none" />

             <motion.h2 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="mb-6 text-3xl font-black tracking-tight text-white sm:text-4xl md:text-6xl"
             >
               Ready to upgrade<br/>your conversations?
             </motion.h2>
             <motion.p 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.1 }}
               className="mx-auto mb-10 max-w-xl text-base text-zinc-400 sm:text-lg md:text-xl"
             >
               Join the next evolution of chat platforms. Free forever for individuals.
             </motion.p>
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               transition={{ delay: 0.2 }}
             >
               <button
                  onClick={() => router.push("/signup")}
                  className="group relative inline-flex h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-full bg-white px-8 text-sm font-bold text-zinc-900 shadow-xl transition-all hover:scale-105 active:scale-95 sm:h-16 sm:w-auto sm:px-10 sm:text-base"
                >
                  Get Started for Free
                  <ChevronRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
             </motion.div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-[var(--background)] px-4 pb-12 pt-16 sm:px-6 sm:pt-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 grid grid-cols-1 gap-10 md:mb-16 md:grid-cols-4 md:gap-12">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                <div className="flex justify-center items-center h-8 w-8 rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/20">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">Aura</span>
              </div>
              <p className="text-zinc-400 max-w-md leading-relaxed font-medium">
                Experience the next generation of messaging. Real-time sub-millisecond sync, quantum-grade encryption, and built-in AI intelligence—wrapped in a breathtaking interface.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Product</h4>
              <ul className="space-y-4">
                <li><a href="#features" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Features</a></li>
                <li><a href="#technology" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Technology</a></li>
                <li><a href="#security" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Security</a></li>
                <li><a href="/signup" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Pricing (Free)</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-bold mb-6 tracking-wide uppercase text-sm">Company</h4>
              <ul className="space-y-4">
                <li><a href="#about" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">About Us</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Blog</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Careers</a></li>
                <li><a href="#" className="text-zinc-500 hover:text-indigo-400 transition-colors font-medium">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-5 border-t border-white/10 pt-8 md:flex-row md:gap-6">
            <p className="text-zinc-600 text-sm font-semibold">© 2026 Aura Inc. All rights reserved.</p>
            
            <div className="flex items-center gap-4">
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10">
                 <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10">
                 <Globe className="h-5 w-5" />
              </a>
              <a href="#" className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full border border-transparent hover:border-white/10">
                 <Bot className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
