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
  { key: 'goals', label: 'Buts totaux', current: 3, threshold: 2.5, max: 6, unit: '', met: true },
  { key: 'corners', label: 'Corners', current: 9, threshold: 8, max: 15, unit: '', met: true },
  { key: 'shots', label: 'Tirs cadrés', current: 7, threshold: 5, max: 12, unit: '', met: true },
  {
    key: 'poss',
    label: 'Possession PSG',
    current: 58,
    threshold: 55,
    max: 100,
    unit: '%',
    met: true,
  },
  { key: 'xg', label: 'xG total', current: 2.3, threshold: 2.5, max: 5, unit: '', met: false },
];

const BENEFITS = [
  {
    kpi: '840+',
    title: 'Signaux Live',
    desc: 'Momentum, corners, tirs, possession, cotes en direct — capturés seconde par seconde sur chaque match en cours. Vous voyez ce que le score ne montre pas encore.',
    bars: [
      { label: 'IN_PLAY', pct: 78 },
      { label: 'PRÉ_MATCH', pct: 58 },
      { label: 'COTES LIVE', pct: 44 },
    ],
  },
  {
    kpi: '500+',
    title: 'Matchs en Direct',
    desc: "MatchIQ scanne simultanément toute l'action mondiale 24h/24. Ce qui se passe sur le terrain, vous le savez en temps réel — pas après la mi-temps.",
    bars: [
      { label: 'EUROPE', pct: 88 },
      { label: 'AMÉRIQUES', pct: 65 },
      { label: 'ASIE', pct: 48 },
    ],
  },
  {
    kpi: '<30s',
    title: 'Alerte Instantanée',
    desc: "Dès que vos conditions se réunissent en live, une alerte Telegram vous arrive avec score, métriques et timing exact. Avant que les cotes n'aient le temps de bouger.",
    bars: [
      { label: 'DÉTECTION', pct: 100 },
      { label: 'ANALYSE', pct: 97 },
      { label: 'ENVOI', pct: 100 },
    ],
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Programmez votre stratégie',
    desc: "Définissez exactement ce que vous cherchez sur un match en direct — métriques live, cotes, timing. L'éditeur visuel combine vos conditions en quelques clics.",
    chip: '"Corners ≥ 8 ET Possession ≥ 60% après 65\'"',
  },
  {
    n: '02',
    title: 'Le live tourne pour vous',
    desc: "MatchIQ scanne 500+ matchs en temps réel, non-stop. Dès que l'action sur le terrain correspond à votre stratégie, le moteur réagit.",
    chip: '512 ligues • scan toutes les 15 secondes',
  },
  {
    n: '03',
    title: 'Recevez. Agissez. Maintenant.',
    desc: "Alerte Telegram instantanée avec score, métriques en direct et contexte complet. Vous êtes notifié dans l'action — pas après le coup.",
    chip: 'Délai < 30s • Score + métriques live inclus',
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Avant je regardais les matchs en espérant repérer le bon moment. Maintenant l'alerte arrive sur mon téléphone pendant que je fais autre chose.",
    author: 'Thomas K.',
    role: 'Parieur professionnel • Paris',
    stat: '+41%',
    statLabel: 'ROI live',
  },
  {
    quote:
      "Les alertes live arrivent avant que les cotes n'aient eu le temps de bouger. C'est exactement ça, l'avantage du direct.",
    author: 'Alexandre M.',
    role: 'Trader sportif • Lyon',
    stat: '−3h',
    statLabel: '/semaine',
  },
  {
    quote:
      "J'analyse 10x plus de matchs en live qu'avant, sans regarder chaque rencontre. MatchIQ fait le travail de surveillance à ma place.",
    author: 'Sarah L.',
    role: 'Analyste indépendante • Bordeaux',
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

  // Show "DÉCLENCHÉ" badge after 2s
  useEffect(() => {
    const t = setTimeout(() => setTriggered(true), 2200);
    return () => clearTimeout(t);
  }, []);

  // Live minute counter
  useEffect(() => {
    const interval = setInterval(() => setMinute((m) => (m >= 90 ? 90 : m + 1)), 5500);
    return () => clearInterval(interval);
  }, []);

  // Stats trigger — démarre dès que la page est rendue (loading terminé, pas de session)
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
    // Fallback : si la section est déjà visible ou l'observer ne tire pas
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
              Se connecter
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 bg-[#10b981] text-[#0f172a] text-sm font-semibold rounded-lg hover:bg-[#34d399] transition-all hover:shadow-[0_0_24px_rgba(16,185,129,0.35)]"
            >
              Commencer →
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
              FOOTBALL LIVE • ALERTES TELEGRAM EN TEMPS RÉEL
            </div>

            <h1
              className="font-display leading-[0.88] tracking-wide text-white mb-8"
              style={{ fontSize: 'clamp(4rem, 9vw, 8rem)' }}
            >
              SAISISSEZ
              <br />
              <span className="text-[#10b981]">L&apos;INSTANT</span>
              <br />
              LIVE
            </h1>

            <p className="text-base text-[#94a3b8] max-w-sm mb-10 leading-relaxed">
              MatchIQ scanne chaque match en direct et déclenche vos alertes Telegram au moment précis
              où l&apos;action se passe — pas après le coup.
            </p>

            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/signup"
                className="group inline-flex items-center gap-2 px-6 py-3.5 bg-[#10b981] text-[#0f172a] font-semibold rounded-lg text-sm hover:bg-[#34d399] transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.4)] hover:scale-[1.03]"
              >
                Commencer gratuitement
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </Link>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-[#1e293b] text-[#94a3b8] rounded-lg text-sm hover:border-[#334155] hover:text-[#f1f5f9] transition-all"
              >
                Comment ça marche
              </a>
            </div>

            <div className="mt-10 flex items-center gap-6 flex-wrap">
              {['Sans carte bancaire', '500+ matchs live', 'Alertes < 30s'].map((t) => (
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
                      Analyse en Direct
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
                    {triggered ? 'DÉCLENCHÉ' : `${minute}'`}
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
                    Métriques · Stratégie &ldquo;Pressure 70+&rdquo;
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
                        STRATÉGIE DÉCLENCHÉE
                      </span>
                    </div>
                    <div className="text-[10px] text-[#64748b] font-mono mt-1">
                      Alerte Telegram envoyée → @ThomasK ✓
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
            { n: matchesCount.toLocaleString('fr-FR'), label: 'Matchs surveillés', trend: '+12%' },
            { n: alertsCount.toLocaleString('fr-FR'), label: 'Alertes envoyées', trend: '+8%' },
            { n: metricsCount + '+', label: 'Métriques disponibles', trend: 'NEW' },
            { n: leaguesCount + '+', label: 'Ligues couvertes', trend: '+5' },
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
              Pourquoi MatchIQ
            </span>
            <h2
              className="font-display text-white mt-3 tracking-wide leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              TOUT SE PASSE
              <br />
              <span className="text-[#10b981]">EN DIRECT</span>
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
              AGISSEZ
              <br />
              <span className="text-[#10b981]">EN TEMPS RÉEL</span>
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
              Témoignages
            </span>
            <h2
              className="font-display text-white mt-3 tracking-wide leading-none"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              ILS NOUS
              <br />
              <span className="text-[#10b981]">FONT CONFIANCE</span>
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
            LIVE MAINTENANT • SANS CARTE BANCAIRE
          </div>

          <h2
            className="font-display text-white leading-[0.88] tracking-wide mb-8"
            style={{ fontSize: 'clamp(4rem, 12vw, 8.5rem)' }}
          >
            NE RATEZ
            <br />
            <span className="text-[#10b981]">PLUS</span>
            <br />
            L&apos;ACTION
          </h2>

          <p className="text-base text-[#94a3b8] max-w-md mx-auto mb-12">
            Des centaines d&apos;opportunités se jouent en direct chaque jour. MatchIQ vous dit
            laquelle saisir — au moment exact où elle se présente.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-[#10b981] text-[#0f172a] font-semibold rounded-xl text-base hover:bg-[#34d399] transition-all hover:shadow-[0_0_60px_rgba(16,185,129,0.45)] hover:scale-105"
            >
              Créer un compte gratuitement
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 border border-[#334155] text-[#94a3b8] rounded-xl text-base hover:border-[#10b981]/30 hover:text-[#f1f5f9] transition-all"
            >
              Se connecter
            </Link>
          </div>

          <p className="mt-8 text-xs text-[#334155]">
            Aucune carte bancaire requise • Accès instantané
          </p>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#1e293b] py-10 px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-xl text-[#10b981] tracking-wider">MATCHIQ</span>
          <div className="flex items-center gap-6 text-xs text-[#475569]">
            <Link href="/login" className="hover:text-[#f1f5f9] transition-colors">
              Connexion
            </Link>
            <Link href="/signup" className="hover:text-[#f1f5f9] transition-colors">
              Inscription
            </Link>
          </div>
          <p className="text-xs text-[#334155]">© 2026 MatchIQ. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
