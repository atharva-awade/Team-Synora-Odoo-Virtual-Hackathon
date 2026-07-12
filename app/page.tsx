"use client";

import { useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight, Rocket, MapPin, Wrench, Fuel, BarChart3, ShieldCheck, Sparkles } from "lucide-react";
import { Brand } from "@/components/app/Brand";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { HeroShowcase } from "@/components/hero/HeroShowcase";
import { CountUp } from "@/components/ui/Kpi";

const FEATURES = [
  { icon: Rocket, title: "Smart Dispatch", desc: "Optimal vehicle and driver pairing with explainable scoring and hard business-rule enforcement." },
  { icon: MapPin, title: "Live Operations", desc: "Real-time dispatch board and status transitions across the whole fleet." },
  { icon: Wrench, title: "Predictive Maintenance", desc: "Service-due forecasting and a workflow that pulls vehicles from the pool automatically." },
  { icon: Fuel, title: "Cost Intelligence", desc: "Fuel, tolls and maintenance rolled into automatic operational cost per vehicle." },
  { icon: BarChart3, title: "ROI Analytics", desc: "Utilization, fuel efficiency and vehicle ROI with one-click CSV export." },
  { icon: ShieldCheck, title: "Compliance Radar", desc: "Licence validity and safety scores tracked continuously, blocking unsafe dispatch." },
];

export default function Landing() {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    gsap.registerPlugin(ScrollTrigger);
    lenis.on("scroll", ScrollTrigger.update);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 42,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 88%" },
        });
      });
    });

    return () => {
      ctx.revert();
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-line bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Brand />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-accent to-accent-2 px-4 py-2 text-sm font-medium text-black transition hover:brightness-110"
            >
              Sign In <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 lg:grid-cols-2 lg:py-24">
        <div className="pointer-events-none absolute -left-40 top-10 h-96 w-96 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <Sparkles className="h-3.5 w-3.5 text-accent" /> Team Synora · Odoo Hackathon 2026
          </div>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            The living <span className="text-gradient">3D command center</span> for your fleet.
          </h1>
          <p className="mt-5 max-w-md text-lg text-muted">
            TransitOps digitizes vehicles, drivers, dispatch, maintenance and cost into one real-time operations platform that runs, decides and watches your fleet.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent-2 px-6 py-3 font-medium text-black shadow-lg shadow-accent/25 transition hover:brightness-110"
            >
              <Rocket className="h-4 w-4" /> Launch Command Center
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-xl border border-line px-6 py-3 font-medium text-ink transition hover:bg-surface-2"
            >
              Explore Features
            </a>
          </div>
        </div>

        <div className="relative">
          <HeroShowcase />
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-line bg-surface/40" data-reveal>
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 md:grid-cols-4">
          <Stat value={53} label="Vehicles managed" />
          <Stat value={81} suffix="%" label="Fleet utilization" />
          <Stat value={10} label="Business rules enforced" />
          <Stat value={4} label="Operational roles" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <div data-reveal className="max-w-xl">
          <h2 className="text-3xl font-semibold tracking-tight">One platform, the entire transport lifecycle.</h2>
          <p className="mt-3 text-muted">From registration to dispatch to analytics, with the guardrails a real logistics operation needs.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              data-reveal
              className="group rounded-2xl border border-line bg-surface p-6 transition-all hover:-translate-y-1 hover:border-accent/40"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Closing CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-24" data-reveal>
        <div className="relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-surface to-surface-2 p-10 text-center sm:p-16">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />
          <h2 className="relative text-3xl font-semibold tracking-tight sm:text-4xl">Ready to take command?</h2>
          <p className="relative mx-auto mt-3 max-w-md text-muted">Sign in with a demo role and dispatch your first trip in seconds.</p>
          <Link
            href="/login"
            className="relative mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-accent to-accent-2 px-7 py-3 font-medium text-black shadow-lg shadow-accent/25 transition hover:brightness-110"
          >
            <Rocket className="h-4 w-4" /> Launch Command Center
          </Link>
        </div>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        TransitOps · Built by Team Synora for the Odoo Virtual Hackathon 2026
      </footer>
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
