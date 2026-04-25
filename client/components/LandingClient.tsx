"use client";

import { API_BASE } from "@/lib/api";
import { motion, useScroll, useTransform } from "framer-motion";
import { AlertCircle, Bot, CheckCircle2, GitPullRequest, Sparkles, Layers, Code2, Zap } from "lucide-react";

const loginHref = `${API_BASE}/auth/github/login`;

function GithubIcon({ className, size = 24 }: { className?: string, size?: number }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  );
}

function GridBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background">
      {/* CodeRabbit-style fine mesh micro-grid */}
      <div 
        className="absolute inset-0 opacity-100"
        style={{
          backgroundImage: 'linear-gradient(to right, rgba(225, 29, 72, 0.2) 1px, transparent 1px), linear-gradient(to bottom, rgba(225, 29, 72, 0.2) 1px, transparent 1px)',
          backgroundSize: '8px 8px',
          maskImage: 'radial-gradient(ellipse at 75% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 70%)',
          WebkitMaskImage: 'radial-gradient(ellipse at 75% 50%, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 70%)'
        }}
      />
      
      {/* Strong Accent Glow illuminating the grid from behind */}
      <div className="absolute top-[10%] right-[0%] w-[50vw] h-[70vh] bg-accent/20 blur-[150px] rounded-full mix-blend-screen" />
    </div>
  );
}

function HeroWorkflowFlow() {
  return (
    <div className="relative w-full h-[550px] flex flex-col justify-center gap-6 py-10 px-4 sm:px-0">
      
      {/* Animated connecting line */}
      <div className="absolute top-[10%] bottom-[10%] left-[32px] sm:left-1/2 w-[2px] bg-border/50 -translate-x-1/2 z-0 overflow-hidden rounded-full">
        <motion.div 
          className="w-full h-1/2 bg-gradient-to-b from-transparent via-accent to-transparent"
          animate={{ y: ['-100%', '200%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* 1. GitHub Issue (Real Design) */}
      <motion.div 
        initial={{ opacity: 0, y: 20, x: 10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full sm:max-w-[320px] ml-14 sm:ml-0 sm:self-end sm:mr-[10%]"
      >
        {/* Connection dot */}
        <div className="absolute top-5 -left-14 sm:left-auto sm:-right-6 w-3 h-3 rounded-full bg-border border-[3px] border-background z-20" />
        
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 text-[#3fb950]">
              <AlertCircle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#e6edf3] leading-snug">
                Memory leak in worker <span className="font-normal text-[#8d96a0]">#142</span>
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#8d96a0]">
                <div className="flex items-center gap-1 rounded-full bg-[#2ea043]/10 px-2 py-0.5 font-medium text-[#3fb950] border border-[#3fb950]/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#3fb950]" /> Open
                </div>
                <span>yesterday</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 2. PatchPilot Agent */}
      <motion.div 
        initial={{ opacity: 0, y: 20, x: -10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 w-full sm:max-w-[340px] ml-14 sm:ml-[5%] sm:self-start"
      >
        {/* Connection dot */}
        <div className="absolute top-1/2 -translate-y-1/2 -left-14 sm:-left-6 w-3 h-3 rounded-full bg-accent border-[3px] border-background z-20 shadow-[0_0_10px_rgba(225,29,72,0.8)]" />
        
        <div className="rounded-xl border border-accent/30 bg-[#0d1117]/90 p-4 shadow-[0_0_40px_rgba(225,29,72,0.15)] backdrop-blur-md">
          <div className="flex items-center gap-3 mb-3 border-b border-[#30363d] pb-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-background border border-[#30363d] shadow-lg">
              <img src="/logo.svg" alt="Agent" className="h-4 w-4" />
            </div>
            <div className="font-mono text-xs font-semibold text-accent">PatchPilot Agent</div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-[10px] text-[#8d96a0] uppercase tracking-wider">Working</span>
            </div>
          </div>
          <div className="font-mono text-[11px] leading-relaxed text-[#8d96a0] space-y-1.5">
            <div><span className="text-accent">{'>'}</span> Analyzing issue context...</div>
            <div><span className="text-accent">{'>'}</span> Found leak in <span className="text-[#e6edf3]">cache.ts</span></div>
            <div className="text-[#3fb950]"><span className="text-[#3fb950]">{'>'}</span> Generated patch + tests passed</div>
            <div className="text-danger bg-danger/10 px-1 rounded inline-block mt-1">- cache.push(job)</div>
            <br/>
            <div className="text-[#3fb950] bg-[#3fb950]/10 px-1 rounded inline-block">+ cache.set(job.id, job, TTL)</div>
          </div>
        </div>
      </motion.div>

      {/* 3. GitHub PR (Real Design) */}
      <motion.div 
        initial={{ opacity: 0, y: 20, x: 10 }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="relative z-10 w-full sm:max-w-[320px] ml-14 sm:ml-0 sm:self-end sm:mr-[10%]"
      >
        {/* Connection dot */}
        <div className="absolute top-5 -left-14 sm:left-auto sm:-right-6 w-3 h-3 rounded-full bg-[#8957e5] border-[3px] border-background z-20" />

        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-4 shadow-2xl">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0 text-[#8957e5]">
              <GitPullRequest size={16} />
            </div>
            <div className="w-full">
              <h3 className="text-sm font-semibold text-[#e6edf3] leading-snug">
                Fix memory leak in worker <span className="font-normal text-[#8d96a0]">#143</span>
              </h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-[#8d96a0]">
                <div className="flex items-center gap-1 rounded-full bg-[#8957e5]/10 px-2 py-0.5 font-medium text-[#8957e5] border border-[#8957e5]/20">
                  <CheckCircle2 size={10} /> Merged
                </div>
                <span>just now</span>
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-mono w-full">
                <span className="text-[#3fb950]">+12</span>
                <span className="text-danger">-4</span>
                <div className="flex h-1.5 w-16 overflow-hidden rounded-sm bg-[#21262d]">
                  <div className="w-[75%] bg-[#3fb950]" />
                  <div className="w-[25%] bg-danger" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
    </div>
  );
}

export default function LandingClient() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, 100]);

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-hidden text-foreground selection:bg-accent/30">
      <GridBackground />

      {/* HEADER */}
      <header className="relative z-50 flex items-center justify-between px-6 py-6 sm:px-12 border-b border-border/40 backdrop-blur-md bg-background/50">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="font-heading text-xl font-bold tracking-tight flex items-center gap-2.5"
        >
          <img src="/logo.svg" alt="PatchPilot" className="h-7 w-auto" />
          PatchPilot
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <a
            href={loginHref}
            className="flex items-center gap-2 rounded-md border border-border/80 bg-surface-elevated/30 px-4 py-2 text-[13px] font-medium text-foreground transition hover:border-accent/40 hover:text-accent"
          >
            <GithubIcon size={14} />
            Sign in
          </a>
        </motion.div>
      </header>

      <main className="relative z-10 flex flex-1 flex-col pb-20">
        
        {/* DESIGNER HERO SECTION */}
        <section className="relative w-full pt-20 sm:pt-32 pb-16 px-6 sm:px-12 overflow-hidden">
          <div className="mx-auto max-w-7xl flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            
            {/* Left: Typography */}
            <div className="w-full lg:w-1/2 relative z-20 flex flex-col items-start text-left">
              {/* <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-4 py-1.5 text-xs font-mono uppercase tracking-widest text-accent"
              >
                <Sparkles size={14} /> The AI Engineer for your repository
              </motion.div> */}
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.7, ease: "easeOut" }}
                className="font-heading text-[3.5rem] sm:text-[5rem] lg:text-[6rem] font-extrabold leading-[1] tracking-tight text-foreground"
              >
                Ship the <span className="text-accent drop-shadow-[0_0_25px_rgba(225,29,72,0.4)]" style={{ fontFamily: "var(--font-handwriting)", fontSize: "1.1em", fontWeight: 600 }}>fix.</span><br />
                <span className="text-muted/80 font-bold tracking-tight">
                  Ignore the noise.
                </span>
              </motion.h1>
              
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-8 max-w-lg text-lg sm:text-xl leading-relaxed text-muted"
              >
                Connect GitHub, target open issues, and let autonomous agents write, test, and submit pull requests while you focus on what matters.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-12 flex flex-wrap items-center gap-4"
              >
                <a
                  href={loginHref}
                  className="flex h-14 items-center justify-center gap-3 rounded-full bg-foreground px-8 text-base font-semibold text-background transition-transform hover:scale-105 active:scale-95"
                >
                  <GithubIcon size={20} />
                  Start Automating
                </a>
              </motion.div>
            </div>

            {/* Right: Workflow Waterfall */}
            <div className="w-full lg:w-1/2 relative z-10">
              <HeroWorkflowFlow />
            </div>

          </div>
        </section>

        {/* WORKFLOW STEPS */}
        <section className="mx-auto w-full max-w-7xl mt-24 mb-16 px-6 sm:px-12">
          <div className="text-center mb-16">
            <h2 className="font-heading text-3xl sm:text-5xl font-bold text-foreground">How it works.</h2>
            <p className="mt-4 text-xl text-muted">Three simple steps to automate your repository.</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Connect",
                desc: "Authorize GitHub once. We only request the minimum scopes required to read issues and push branches.",
                icon: GithubIcon
              },
              {
                step: "02",
                title: "Target",
                desc: "Select a repository, filter out the noise, and dispatch agents to work on multiple threads concurrently.",
                icon: (props: any) => <img src="/logo.svg" alt="Agent" style={{ width: props.size, height: props.size }} className="opacity-70 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
              },
              {
                step: "03",
                title: "Review",
                desc: "Receive concrete, tested pull requests. Review the diffs and merge when it looks right.",
                icon: CheckCircle2
              }
            ].map((item, i) => (
              <motion.div 
                key={item.step}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="group relative overflow-hidden rounded-[2rem] border border-border bg-surface p-8 sm:p-10 transition-all duration-300 hover:border-accent/40 hover:bg-surface-elevated/50 hover:shadow-[0_0_40px_rgba(225,29,72,0.05)]"
              >
                {/* Giant Background Number */}
                <div className="absolute -right-4 -top-8 text-[140px] font-black text-white/[0.02] group-hover:text-accent/[0.05] transition-colors duration-500 pointer-events-none select-none font-heading tracking-tighter">
                  {item.step}
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-background border border-border shadow-sm group-hover:border-accent/40 transition-colors duration-300">
                    <item.icon size={28} className="text-muted group-hover:text-accent transition-colors duration-300" />
                  </div>
                  
                  <h3 className="font-heading text-2xl font-bold text-foreground mb-4">{item.title}</h3>
                  <p className="text-lg leading-relaxed text-muted group-hover:text-muted/90 transition-colors duration-300">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* BENTO FEATURES SECTION */}
        <section className="mx-auto w-full max-w-7xl mt-32 px-6 sm:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-foreground tracking-tight">Built for modern engineering speed.</h2>
            <p className="mt-4 text-xl text-muted">Everything you need to automate your issue backlog.</p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[300px]">
            {/* Box 1: Concurrent Agents */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="group relative md:col-span-2 overflow-hidden rounded-3xl border border-border bg-surface p-8 transition-colors hover:bg-surface-elevated/50"
            >
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/10 blur-3xl rounded-full transition-opacity opacity-0 group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border shadow-sm">
                  <Layers size={24} className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Concurrent Threading</h3>
                  <p className="text-muted text-lg max-w-md">Agents work in parallel. Dispatch ten fixes at once, and they'll all be processed simultaneously on separate branches.</p>
                </div>
              </div>
            </motion.div>

            {/* Box 2: Deep Context */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-8 transition-colors hover:bg-surface-elevated/50"
            >
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/10 blur-3xl rounded-full transition-opacity opacity-0 group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border shadow-sm">
                  <Code2 size={24} className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">Deep Context</h3>
                  <p className="text-muted">Agents read the whole repo, not just the issue description.</p>
                </div>
              </div>
            </motion.div>

            {/* Box 3: CI/CD */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="group relative overflow-hidden rounded-3xl border border-border bg-surface p-8 transition-colors hover:bg-surface-elevated/50"
            >
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-accent/10 blur-3xl rounded-full transition-opacity opacity-0 group-hover:opacity-100" />
              <div className="relative z-10 flex flex-col h-full">
                <div className="mb-auto inline-flex h-12 w-12 items-center justify-center rounded-xl bg-background border border-border shadow-sm">
                  <CheckCircle2 size={24} className="text-foreground" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-foreground mb-2">CI/CD Aware</h3>
                  <p className="text-muted">Code is verified via tests before the PR is even opened.</p>
                </div>
              </div>
            </motion.div>

            {/* Box 4: CTA Box */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="group relative md:col-span-2 overflow-hidden rounded-3xl border border-accent/20 bg-accent/10 p-8 flex items-center justify-between"
            >
              <div className="relative z-10">
                <h3 className="text-3xl font-semibold text-foreground mb-4">Start fixing today.</h3>
                <p className="text-muted text-lg max-w-sm mb-8">Drop your backlog into PatchPilot and watch your open issues disappear.</p>
                <a
                  href={loginHref}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-foreground px-8 font-semibold text-background transition-transform hover:scale-105 active:scale-95 shadow-xl"
                >
                  <GithubIcon size={16} /> Connect GitHub
                </a>
              </div>
              <div className="hidden md:flex relative w-48 h-48 items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full border border-dashed border-accent/40"
                />
                <motion.div 
                  animate={{ rotate: -360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-4 rounded-full border border-dashed border-accent/20"
                />
                <Zap size={40} className="text-accent relative z-10" />
              </div>
            </motion.div>
          </div>
        </section>

        {/* FINAL CTA SECTION */}
        <section className="relative mx-auto w-full max-w-7xl mt-32 mb-10 px-6 sm:px-12">
           <div className="relative rounded-3xl border border-border bg-surface-elevated/30 p-12 sm:p-20 text-center overflow-hidden">
             <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-accent/10 blur-[100px] rounded-full mix-blend-screen pointer-events-none" />
             
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               className="relative z-10"
             >
               <h2 className="font-heading text-4xl sm:text-6xl font-bold text-foreground tracking-tight mb-6">
                 Ready when your backlog is.
               </h2>
               <p className="text-xl text-muted max-w-2xl mx-auto mb-10">
                 Stop switching context to fix minor bugs. Let PatchPilot handle the noise so you can focus on shipping features.
               </p>
               <a
                 href={loginHref}
                 className="inline-flex h-14 items-center justify-center gap-3 rounded-md bg-accent px-10 text-base font-semibold text-white transition hover:bg-accent-hover active:scale-[0.98] shadow-lg shadow-accent/20"
               >
                 <GithubIcon size={20} />
                 Start Automating Now
               </a>
             </motion.div>
           </div>
        </section>

      </main>

      <footer className="relative z-10 border-t border-border py-10 text-center text-sm text-muted/80">
        <p>
          PatchPilot © {new Date().getFullYear()} —{" "}
          <a href="https://github.com" className="underline decoration-border/80 underline-offset-2 transition hover:text-foreground">
            GitHub OAuth
          </a>
        </p>
      </footer>
    </div>
  );
}
