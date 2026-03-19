'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

// ─── Animated counter ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let frameId: number;
    let startTime: number | null = null;
    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [trigger, target, duration]);
  return value;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const LIVE_METRICS = [
  { key: 'goals', label: 'Total goals', current: 3, threshold: 2.5, max: 6, unit: '', met: true },
  { key: 'corners', label: 'Corners', current: 9, threshold: 8, max: 15, unit: '', met: true },
  { key: 'shots', label: 'Shots on target', current: 7, threshold: 5, max: 12, unit: '', met: true },
  {
    key: 'poss',
    label: 'PSG Possession',
    current: 58,
    threshold: 55,
    max: 100,
    unit: '%',
    met: true,
  },
  { key: 'xg', label: 'Total xG', current: 2.3, threshold: 2.5, max: 5, unit: '', met: false },
];

const BENEFITS = [
  {
    kpi: '840+',
    title: 'Live Signals',
    desc: 'Momentum, corners, shots, possession, live odds — captured second by second on every live match. You see what the scoreline does not show yet.',
    bars: [
      { label: 'IN_PLAY', pct: 78 },
      { label: 'PRE_MATCH', pct: 58 },
      { label: 'LIVE ODDS', pct: 44 },
    ],
  },
  {
    kpi: '500+',
    title: 'Live Matches',
    desc: 'MatchIQ simultaneously scans all global action 24/7. What happens on the pitch, you know in real time — not after half time.',
    bars: [
      { label: 'EUROPE', pct: 88 },
      { label: 'AMERICAS', pct: 65 },
      { label: 'ASIA', pct: 48 },
    ],
  },
  {
    kpi: '<30s',
    title: 'Instant Alert',
    desc: 'The moment your conditions are met live, a Telegram alert reaches you with score, metrics and exact timing. Before odds have time to move.',
    bars: [
      { label: 'DETECTION', pct: 100 },
      { label: 'ANALYSIS', pct: 97 },
      { label: 'DELIVERY', pct: 100 },
    ],
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Set your strategy',
    desc: 'Define exactly what you are looking for in a live match — live metrics, odds, timing. The visual editor combines your conditions in a few clicks.',
    chip: '"Corners ≥ 8 AND Possession ≥ 60% after 65\'"',
  },
  {
    n: '02',
    title: 'Live runs for you',
    desc: 'MatchIQ scans 500+ matches in real time, non-stop. The moment the action on the pitch matches your strategy, the engine reacts.',
    chip: '512 leagues • scan every 15 seconds',
  },
  {
    n: '03',
    title: 'Receive. Act. Now.',
    desc: 'Instant Telegram alert with score, live metrics and full context. You are notified in the action — not after the fact.',
    chip: 'Delay < 30s • Score + live metrics included',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "I used to watch matches hoping to spot the right moment. Now the alert arrives on my phone while I'm doing something else.",
    author: 'Thomas K.',
    role: 'Professional bettor • Paris',
    stat: '+41%',
    statLabel: 'Live ROI',
  },
  {
    quote:
      "Live alerts arrive before odds have had time to move. That's exactly it — the edge of real time.",
    author: 'Alexandre M.',
    role: 'Sports trader • Lyon',
    stat: '−3h',
    statLabel: '/week',
  },
  {
    quote:
      "I analyse 10x more live matches than before, without watching each one. MatchIQ does the monitoring for me.",
    author: 'Sarah L.',
    role: 'Independent analyst • Bordeaux',
    stat: '+34%',
    statLabel: 'ROI',
  },
];

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const statsRef = useRef<HTMLDivElement>(null);
  const [statsVisible, setStatsVisible] = useState(false);
  const [barsReady, setBarsReady] = useState(false);
  const [minute, setMinute] = useState(67);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    if (!loading && session) router.push('/strategies');
  }, [session, loading, router]);

  // Animate metric bars after mount
  useEffect(() => {
    const t = setTimeout(() => setBarsReady(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Show "TRIGGERED" badge after 2s
  useEffect(() => {
    const t = setTimeout(() => setTriggered(true), 2200);
    return () => clearTimeout(t);
  }, []);

  // Live minute counter
  useEffect(() => {
    const interval = setInterval(() => setMinute((m) => (m >= 90 ? 90 : m + 1)), 5500);
    return () => clearInterval(interval);
  }, []);

  // Stats trigger — starts as soon as the page renders (loading done, no session)
  useEffect(() => {
    if (loading || session) return;
    const el = statsRef.current;
    if (!el) return;
    const trigger = () => setStatsVisible(true);
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          trigger();
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    // Fallback: if the section is already visible or the observer does not fire
    const fallback = setTimeout(trigger, 1200);
    return () => {
      observer.disconnect();
      clearTimeout(fallback);
    };
  }, [loading, session]);

  const matchesCount = useCountUp(15420, 2000, statsVisible);
  const alertsCount = useCountUp(182543, 2200, statsVisible);
  const metricsCount = useCountUp(166, 1500, statsVisible);
  const leaguesCount = useCountUp(512, 1800, statsVisible);

  if (loading || session) return null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9] font-body overflow-x-hidden">
      {/* ── Noise texture ──────────────────────────────────────────────────── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-10 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '200px 200px',
        }}
      />

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 border-b border-[#1e293b] bg-[#0f172a]/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <span className="font-display text-2xl text-[#10b981] tracking-wider select-none">
              MATCHIQ
            </span>
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono text-[#10b981] border border-[#10b981]/20 bg-[#10b981]/5">
              <span className="w-1 h-1 rounded-full bg-[#10b981] animate-pulse-slow" />
              LIVE
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-sm text-[#64748b] hover:text-[#f1f5f9] transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#10b981] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#34d399] transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]"
            >
              Get started →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden">
        {/* Subtle pitch grid */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.025) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />
        {/* Blue glow top-right */}
        <div
          aria-hidden
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 80% 20%, rgba(96,165,250,0.07) 0%, transparent 55%)',
          }}
        />
        {/* Green glow bottom-left */}
        <div
          aria-hidden
          className="absolute bottom-0 left-0 w-1/3 h-1/2 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at 20% 90%, rgba(16,185,129,0.06) 0%, transparent 55%)',
          }}
        />

        <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 gap-16 items-center py-28 w-full relative z-10">
          {/* Left: headline */}
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e293b] bg-[#1e293b] text-xs text-[#94a3b8] font-mono tracking-wider mb-10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse-slow inline-block" />
              FOOTBALL LIVE • REAL-TIME TELEGRAM ALERTS
            </div>

            <h1
              className="font-display leading-[0.88] tracking-wide text-white mb-8"
              style={{ fontSize: 'clamp(4rem, 9vw, 8rem)' }}
            >
              CAPTURE
              <br />
              <span className="text-[#10b981]">THE MOMENT</span>
              <br />
              LIVE
            </h1>

            <p className="text-base text-[#94a3b8] max-w-sm mb-10 leading-relaxed">
              MatchIQ scans every live match and fires your Telegram alerts at the exact moment the
              action happens — not after the fact.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#10b981] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#34d399] transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-[1.03]"
              >
                Start for free
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#1e293b] text-[#94a3b8] rounded-lg text-sm hover:border-[#334155] hover:text-[#f1f5f9] transition-all"
              >
                How it works
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 flex-wrap">
              {['No credit card', '500+ live matches', 'Alerts < 30s'].map((t) => (
                <div key={t} className="flex items-center gap-1.5 text-xs text-[#475569]">
                  <span className="text-[#10b981]">✓</span> {t}
                </div>
              ))}
            </div>
          </div>

          {/* Right: live analytics card */}
          <div className="animate-fade-up-d1 w-full max-w-md lg:ml-auto">
            <div className="relative">
              {/* Glow behind card */}
              <div
                aria-hidden
                className="absolute -inset-8 rounded-3xl pointer-events-none"
                style={{
                  background: 'radial-gradient(ellipse, rgba(16,185,129,0.09) 0%, transparent 70%)',
                }}
              />

              {/* Card */}
              <div className="relative rounded-2xl border border-[#334155] bg-[#1e293b] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.7)]">
                {/* Card header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#334155] bg-[#0f172a]/50">
                  <div>
                    <div className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-0.5">
                      UEFA CHAMPIONS LEAGUE
                    </div>
                    <div className="text-xs font-semibold text-[#94a3b8] font-mono">
                      Live Analysis
                    </div>
                  </div>
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all duration-700 ${
                      triggered
                        ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                        : 'bg-[#60a5fa]/10 text-[#60a5fa] border border-[#60a5fa]/20'
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        triggered ? 'bg-[#10b981] animate-pulse' : 'bg-[#60a5fa] animate-pulse-slow'
                      }`}
                    />
                    {triggered ? 'TRIGGERED' : `${minute}'`}
                  </div>
                </div>

                {/* Scoreboard */}
                <div className="px-5 py-4 border-b border-[#334155]/50">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <div className="font-display text-2xl text-white tracking-wide">PSG</div>
                      <div className="text-[10px] text-[#475569] font-mono mt-0.5">Paris SG</div>
                    </div>
                    <div className="text-center px-4">
                      <div
                        className="font-display text-4xl tracking-wider transition-colors duration-700"
                        style={{ color: triggered ? '#10b981' : '#60a5fa' }}
                      >
                        2—1
                      </div>
                      <div className="text-[10px] text-[#475569] font-mono mt-1">
                        {minute}&apos;
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <div className="font-display text-2xl text-white tracking-wide">FCB</div>
                      <div className="text-[10px] text-[#475569] font-mono mt-0.5">FC Bayern</div>
                    </div>
                  </div>
                </div>

                {/* Metrics bars */}
                <div className="p-5 space-y-3.5">
                  <div className="text-[10px] font-mono text-[#475569] uppercase tracking-widest mb-4">
                    Metrics · Strategy &ldquo;Pressure 70+&rdquo;
                  </div>
                  {LIVE_METRICS.map((m, i) => {
                    const fillPct = Math.min((m.current / m.max) * 100, 100);
                    const thresholdPct = (m.threshold / m.max) * 100;
                    return (
                      <div key={m.key}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-mono text-[#94a3b8]">{m.label}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[11px] font-mono font-semibold ${
                                m.met ? 'text-[#10b981]' : 'text-[#60a5fa]'
                              }`}
                            >
                              {m.current}
                              {m.unit}
                            </span>
                            <span className="text-[10px] text-[#475569] font-mono">
                              /{m.threshold}
                              {m.unit}
                            </span>
                            {m.met && <span className="text-[#10b981] text-[10px]">✓</span>}
                          </div>
                        </div>
                        <div className="relative h-1.5 bg-[#0f172a] rounded-full overflow-visible">
                          {/* Threshold marker */}
                          <div
                            aria-hidden
                            className="absolute top-1/2 -translate-y-1/2 w-px h-3 bg-[#475569] z-10"
                            style={{ left: `${thresholdPct}%` }}
                          />
                          {/* Fill */}
                          <div
                            className="h-full rounded-full transition-all ease-out"
                            style={{
                              width: barsReady ? `${fillPct}%` : '0%',
                              transitionDuration: '1200ms',
                              transitionDelay: `${i * 130}ms`,
                              backgroundColor: m.met ? '#10b981' : '#60a5fa',
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Alert footer */}
                {triggered && (
                  <div className="mx-5 mb-5 px-4 py-3 rounded-xl bg-[#10b981]/10 border border-[#10b981]/25 animate-slide-in">
                    <div className="flex items-center gap-2">
                      <span className="text-[#10b981] text-sm">⚡</span>
                      <span className="text-xs font-mono font-semibold text-[#10b981]">
                        STRATEGY TRIGGERED
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748b] font-mono mt-1">
                      Telegram alert sent → @ThomasK ✓
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── KPI stats bar ─────────────────────────────────────────────────────── */}
      <div ref={statsRef} className="border-y border-[#1e293b] bg-[#1e293b]/30">
        <div className="mx-auto max-w-7xl px-6 py-10 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[#1e293b]">
          {[
            { n: matchesCount.toLocaleString('en-US'), label: 'Matches monitored', trend: '+12%' },
            { n: alertsCount.toLocaleString('en-US'), label: 'Alerts sent', trend: '+8%' },
            { n: metricsCount + '+', label: 'Available metrics', trend: 'NEW' },
            { n: leaguesCount + '+', label: 'Leagues covered', trend: '+5' },
          ].map(({ n, label, trend }) => (
            <div key={label} className="text-center px-6 py-2">
              <div className="font-display text-5xl text-white tracking-wider leading-none mb-1">
                {n}
              </div>
              <div className="text-xs text-[#475569] uppercase tracking-widest font-mono mb-2">
                {label}
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#10b981]">
                ↑ {trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Benefits ──────────────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <span className="font-mono text-xs text-[#475569] uppercase tracking-widest">
              Why MatchIQ
            </span>
            <h2
              className="font-display text-white mt-3 tracking-wide leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              IT ALL HAPPENS
              <br />
              <span className="text-[#10b981]">LIVE</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {BENEFITS.map(({ kpi, title, desc, bars: benefitBars }) => (
              <div
                key={title}
                className="group p-8 rounded-2xl border border-[#334155] bg-[#1e293b] hover:border-[#10b981]/25 transition-all duration-300"
              >
                <div className="font-display text-6xl text-[#10b981] leading-none mb-2">{kpi}</div>
                <h3 className="font-display text-2xl text-white tracking-wide mb-3">{title}</h3>
                <p className="text-sm text-[#64748b] leading-relaxed mb-6">{desc}</p>

                {/* Mini bar chart */}
                <div className="space-y-2.5">
                  {benefitBars.map((bar, i) => (
                    <div key={bar.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-mono text-[#475569]">{bar.label}</span>
                        <span className="text-[10px] font-mono text-[#64748b]">{bar.pct}%</span>
                      </div>
                      <div className="h-1 bg-[#0f172a] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all ease-out"
                          style={{
                            width: barsReady ? `${bar.pct}%` : '0%',
                            transitionDuration: '1000ms',
                            transitionDelay: `${i * 160}ms`,
                            backgroundColor: '#10b981',
                            opacity: 1 - i * 0.2,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section id="how" className="py-32 px-6 border-t border-[#1e293b]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <span className="font-mono text-xs text-[#475569] uppercase tracking-widest">
              Process
            </span>
            <h2
              className="font-display text-white mt-3 tracking-wide leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              ACT
              <br />
              <span className="text-[#10b981]">IN REAL TIME</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 relative">
            {/* Connector line */}
            <div
              aria-hidden
              className="hidden lg:block absolute top-[2.75rem] left-[34%] right-[34%] h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(16,185,129,0.3), transparent)',
              }}
            />

            {STEPS.map(({ n, title, desc, chip }) => (
              <div key={n} className="relative">
                <div className="font-display text-[7rem] text-[#1e293b] absolute -top-4 -left-2 leading-none pointer-events-none select-none">
                  {n}
                </div>
                <div className="relative pt-10">
                  <div className="w-9 h-9 rounded-xl border border-[#10b981]/30 bg-[#10b981]/8 flex items-center justify-center mb-5">
                    <span className="text-[#10b981] text-sm font-mono font-bold">
                      {parseInt(n)}
                    </span>
                  </div>
                  <h3 className="font-display text-2xl text-white tracking-wide mb-3">{title}</h3>
                  <p className="text-sm text-[#64748b] leading-relaxed mb-5">{desc}</p>
                  <div className="font-mono text-xs text-[#10b981] bg-[#10b981]/5 border border-[#10b981]/15 rounded-lg px-3 py-2.5">
                    {chip}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ──────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 border-t border-[#1e293b]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <span className="font-mono text-xs text-[#475569] uppercase tracking-widest">
              Testimonials
            </span>
            <h2
              className="font-display text-white mt-3 tracking-wide leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              THEY
              <br />
              <span className="text-[#10b981]">TRUST US</span>
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-5">
            {TESTIMONIALS.map(({ quote, author, role, stat, statLabel }) => (
              <div
                key={author}
                className="p-8 rounded-2xl border border-[#334155] bg-[#1e293b] flex flex-col gap-5"
              >
                <div className="font-display text-5xl text-[#10b981]/30 leading-none select-none">
                  &ldquo;
                </div>
                <p className="text-sm text-[#94a3b8] leading-relaxed flex-1">{quote}</p>
                <div className="flex items-end justify-between pt-5 border-t border-[#334155]">
                  <div>
                    <div className="text-sm font-semibold text-[#f1f5f9]">{author}</div>
                    <div className="text-xs text-[#475569] font-mono mt-0.5">{role}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-display text-2xl tracking-wide text-[#10b981]">{stat}</div>
                    <div className="text-[10px] text-[#475569] font-mono">{statLabel}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────────────── */}
      <section className="relative py-40 px-6 overflow-hidden border-t border-[#1e293b]">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, transparent 60%)',
          }}
        />
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(rgba(16,185,129,1) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,1) 1px, transparent 1px)',
            backgroundSize: '64px 64px',
          }}
        />

        <div className="mx-auto max-w-4xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e293b] bg-[#1e293b] text-xs text-[#94a3b8] font-mono tracking-wider mb-10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse-slow inline-block" />
            LIVE NOW • NO CREDIT CARD
          </div>

          <h2
            className="font-display text-white leading-[0.88] tracking-wide mb-8"
            style={{ fontSize: 'clamp(4rem, 12vw, 8.5rem)' }}
          >
            NEVER
            <br />
            <span className="text-[#10b981]">MISS</span>
            <br />
            THE ACTION
          </h2>

          <p className="text-base text-[#94a3b8] max-w-md mx-auto mb-12">
            Hundreds of opportunities play out live every day. MatchIQ tells you which one to take
            — at the exact moment it appears.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-[#10b981] text-[#0f172a] font-semibold rounded-xl text-base hover:bg-[#34d399] transition-all hover:shadow-[0_0_60px_rgba(16,185,129,0.45)] hover:scale-105"
            >
              Create a free account
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 border border-[#334155] text-[#94a3b8] rounded-xl text-base hover:border-[#10b981]/30 hover:text-[#f1f5f9] transition-all"
            >
              Sign in
            </Link>
          </div>

          <p className="mt-8 text-xs text-[#334155]">
            No credit card required • Instant access
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e293b] py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl text-[#10b981] tracking-wider">MATCHIQ</span>
          <div className="flex items-center gap-6 text-xs text-[#475569]">
            <Link href="/login" className="hover:text-[#f1f5f9] transition-colors">
              Sign in
            </Link>
            <Link href="/signup" className="hover:text-[#f1f5f9] transition-colors">
              Sign up
            </Link>
          </div>
          <p className="text-xs text-[#334155]">© 2026 MatchIQ. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
