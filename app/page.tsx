"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight, Rocket, MapPin, Wrench, Fuel, BarChart3, ShieldCheck, ChevronDown } from "lucide-react";
import { Brand } from "@/components/app/Brand";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { CountUp } from "@/components/ui/Kpi";
import { useStory } from "@/lib/story-store";

const StoryCanvas = dynamic(() => import("@/components/hero/StoryCanvas"), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center text-sm text-muted">Loading 3D fleet...</div>,
});

const CHAPTERS = [
  { key: "intro", eyebrow: "Team Synora · Odoo Hackathon 2026", desc: "Vehicles, drivers, dispatch, maintenance and cost unified into one real-time operations platform.", intro: true, icon: Rocket },
  { key: "dispatch", eyebrow: "01 · Dispatch", title: "Smart Dispatch", desc: "Assign the optimal vehicle and driver with explainable scoring and hard business-rule enforcement.", icon: Rocket },
  { key: "tracking", eyebrow: "02 · Live Tracking", title: "Live Tracking", desc: "Watch every dispatched trip move along its route on a real map, in real time.", icon: MapPin },
  { key: "maintenance", eyebrow: "03 · Maintenance", title: "Predictive Maintenance", desc: "Forecast service intervals and pull vehicles from the dispatch pool automatically.", icon: Wrench },
  { key: "fuel", eyebrow: "04 · Fuel and Cost", title: "Cost Intelligence", desc: "Fuel, tolls and maintenance rolled into automatic operational cost per vehicle.", icon: Fuel },
  { key: "analytics", eyebrow: "05 · Analytics", title: "ROI Analytics", desc: "Utilization, fuel efficiency and vehicle ROI with one-click export.", icon: BarChart3 },
  { key: "compliance", eyebrow: "06 · Compliance", title: "Compliance Radar", desc: "Licence validity and safety scores tracked continuously, blocking unsafe dispatch.", icon: ShieldCheck },
];

const FEATURES = CHAPTERS.slice(1);

function ChapterCard() {
  const idx = useStory((s) => Math.max(0, Math.min(6, Math.round(s.progress * 6))));
  const c = CHAPTERS[idx];
  const Icon = c.icon;
  return (
    <div className="pointer-events-none flex flex-col items-center px-4">
      <div key={c.key} className="panel animate-fade-in w-full max-w-xl rounded-2xl p-6 text-center">
        <div className="mb-2 inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-accent">
          <Icon className="h-4 w-4" /> {c.eyebrow}
        </div>
        {c.intro ? (
          <>
            <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
              The living <span className="text-gradient">3D command center</span> for your fleet.
            </h1>
            <p className="mx-auto mt-2.5 max-w-md text-sm text-muted">{c.desc}</p>
            <Link href="/login" className="pointer-events-auto mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent-2 px-6 py-2.5 text-sm font-medium text-black shadow-lg shadow-accent/25 transition hover:brightness-110">
              <Rocket className="h-4 w-4" /> Launch Command Center
            </Link>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{c.title}</h2>
            <p className="mx-auto mt-2.5 max-w-md text-sm text-muted">{c.desc}</p>
          </>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        {CHAPTERS.map((ch, i) => (
          <span key={ch.key} className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? "w-8 bg-accent" : "w-1.5 bg-muted/40"}`} />
        ))}
      </div>
    </div>
  );
}

export default function Landing() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.09 });
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);

    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);

    const st = ScrollTrigger.create({
      trigger: stageRef.current,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => useStory.getState().set(self.progress),
      onToggle: (self) => setActive(self.isActive),
    });

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, { opacity: 0, y: 40, duration: 0.85, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%" } });
      });
    });

    return () => { st.kill(); ctx.revert(); cancelAnimationFrame(raf); lenis.destroy(); };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <header className="fixed inset-x-0 top-0 z-50 border-b border-line bg-bg/60 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Brand />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-accent to-accent-2 px-4 py-2 text-sm font-medium text-black transition hover:brightness-110">
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Fixed 3D stage: truck locked at screen center, camera orbits on scroll */}
      <div className={`fixed inset-0 z-0 transition-opacity duration-500 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at 50% 58%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 62%)" }}
        />
        <div className="absolute inset-0">
          <StoryCanvas />
        </div>
      </div>

      {/* Fixed chapter card */}
      <div className={`fixed inset-x-0 bottom-8 z-20 transition-opacity duration-500 ${active ? "opacity-100" : "pointer-events-none opacity-0"}`}>
        <ChapterCard />
      </div>

      {/* Scroll spacer that drives the story (transparent, does not block) */}
      <section ref={stageRef} className="pointer-events-none relative z-10" style={{ height: "600vh" }} aria-hidden />

      <div className="pointer-events-none absolute bottom-4 right-6 z-20 flex items-center gap-1.5 text-xs text-muted">
        Scroll to explore <ChevronDown className="h-3.5 w-3.5 animate-bounce" />
      </div>

      {/* Content (opaque, scrolls over the fixed canvas) */}
      <div className="relative z-10 bg-bg">
        <section className="border-y border-line bg-surface/40" data-reveal>
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-12 md:grid-cols-4">
            <Stat value={53} label="Vehicles managed" />
            <Stat value={81} suffix="%" label="Fleet utilization" />
            <Stat value={10} label="Business rules enforced" />
            <Stat value={4} label="Operational roles" />
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-5 py-20">
          <div data-reveal className="max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight">One platform, the entire transport lifecycle.</h2>
            <p className="mt-3 text-muted">From registration to dispatch to analytics, with the guardrails a real logistics operation needs.</p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.key} data-reveal className="group rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent/40">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/20">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24" data-reveal>
          <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-surface-2 p-10 text-center sm:p-16">
            <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
            <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">Ready to take command?</h2>
            <p className="relative mx-auto mt-3 max-w-md text-muted">Sign in with a demo role and dispatch your first trip in seconds.</p>
            <Link href="/login" className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent-2 px-7 py-3 font-medium text-black shadow-lg shadow-accent/25 transition hover:brightness-110">
              <Rocket className="h-4 w-4" /> Launch Command Center
            </Link>
          </div>
        </section>

        <footer className="border-t border-line py-8 text-center text-sm text-muted">
          TransitOps · Built by Team Synora for the Odoo Virtual Hackathon 2026
        </footer>
      </div>
    </div>
  );
}

function Stat({ value, label, suffix }: { value: number; label: string; suffix?: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-semibold text-ink">
        <CountUp value={value} suffix={suffix} />
      </div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  );
}
