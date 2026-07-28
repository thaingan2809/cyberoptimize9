import { useEffect, useRef, useState } from 'react';
import {
  Brain, Zap, AlertTriangle, Activity, Cpu, Radio, Wifi,
  ShieldCheck, Gauge,
} from 'lucide-react';

const PHASES = [
  { pct: 20, label: 'Twitchy', color: '#39FF14', desc: 'Mild tremors. You checked the chart twice.' },
  { pct: 45, label: 'Hyper-Reflex', color: '#00F0FF', desc: 'Sandevistan kicks in. Fingers blur across the swap button.' },
  { pct: 70, label: 'Overclocked', color: '#FFE600', desc: 'Heart rate 180. You\'re diamond-handling a memecoin at 3 AM.' },
  { pct: 90, label: 'Cyberpsycho', color: '#FF00A8', desc: 'Reality is a construct. There is only $CYBER.' },
  { pct: 100, label: 'FLATLINE', color: '#FF2D2D', desc: 'You\'ve become the chart. The chart is you. GG.' },
];

interface Widget {
  key: string;
  label: string;
  icon: typeof Activity;
  color: string;
  base: number;
  unit: string;
  variance: number;
  int: boolean;
  x: number;
  y: number;
  dur: number;
  delay: number;
}

const WIDGETS: Widget[] = [
  { key: 'hr', label: 'HEART RATE', icon: Activity, color: '#FF2D2D', base: 182, unit: 'BPM', variance: 4, int: true, x: 3, y: 16, dur: 9, delay: 0 },
  { key: 'nl', label: 'NEURAL LOAD', icon: Cpu, color: '#00F0FF', base: 79, unit: '%', variance: 6, int: true, x: 82, y: 12, dur: 11, delay: 1.5 },
  { key: 'me', label: 'MEME EXPOSURE', icon: Radio, color: '#FF00A8', base: 0, unit: '', variance: 0, int: false, x: 5, y: 74, dur: 10, delay: 0.8 },
  { key: 'ns', label: 'NETWORK STATUS', icon: Wifi, color: '#39FF14', base: 0, unit: '', variance: 0, int: false, x: 79, y: 78, dur: 12, delay: 2 },
  { key: 'bl', label: 'BLOCKCHAIN LATENCY', icon: ShieldCheck, color: '#FFE600', base: 12, unit: 'ms', variance: 3, int: true, x: 41, y: 4, dur: 8, delay: 0.3 },
  { key: 'ai', label: 'AI PREDICTION', icon: Gauge, color: '#00F0FF', base: 0, unit: '', variance: 0, int: false, x: 44, y: 90, dur: 13, delay: 1.2 },
];

const MEME_LEVELS = ['LOW', 'MED', 'HIGH', 'CRITICAL'];
const NET_STATES = ['CONNECTED', 'SYNCING', 'ONLINE'];
const AI_PREDS = ['STABLE', 'ELEVATED', 'OVERCLOCKED', 'CRITICAL'];

const STATUS_INDICATORS = [
  { text: 'ONLINE', x: 14, y: 8, blink: true },
  { text: 'SYNC', x: 88, y: 20, blink: false },
  { text: 'LOCKED', x: 9, y: 44, blink: false },
  { text: 'ACTIVE', x: 91, y: 48, blink: true },
  { text: 'TRACKING', x: 16, y: 90, blink: false },
  { text: 'VERIFYING', x: 84, y: 92, blink: true },
  { text: 'MONITORING', x: 50, y: 96, blink: false },
  { text: 'CONNECTED', x: 93, y: 64, blink: false },
];

const BG_IMAGE = 'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/2/wp14146075-cyberpunk-edgerunners-desktop-wallpapers.webp?updatedAt=1785235621645';

export default function CyberpsychoMeter() {
  const [level, setLevel] = useState(0);
  const [auto, setAuto] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);

  /* auto-pan the meter value up and down */
  useEffect(() => {
    if (!auto) return;
    let raf = 0;
    let dir = 1;
    let last = performance.now();
    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setLevel((l) => {
        let next = l + dir * dt * 22;
        if (next >= 100) { next = 100; dir = -1; }
        if (next <= 0) { next = 0; dir = 1; }
        return next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [auto]);

  const current = [...PHASES].reverse().find((p) => level >= p.pct) ?? PHASES[0];
  const intensity = level / 100; /* 0..1 drives HUD reactivity */

  /* live diagnostic values — smooth drift toward targets */
  const [vitals, setVitals] = useState(() => WIDGETS.map((w) => w.base));
  useEffect(() => {
    const id = setInterval(() => {
      setVitals((prev) =>
        prev.map((v, i) => {
          const w = WIDGETS[i];
          if (w.key === 'me' || w.key === 'ns' || w.key === 'ai') return v;
          const target = w.base + (Math.random() - 0.5) * 2 * w.variance + intensity * w.variance;
          return v + (target - v) * 0.4;
        }),
      );
    }, 1400);
    return () => clearInterval(id);
  }, [intensity]);

  const [memeIdx, setMemeIdx] = useState(2);
  const [netIdx, setNetIdx] = useState(0);
  const [aiIdx, setAiIdx] = useState(1);
  useEffect(() => {
    const id = setInterval(() => {
      setMemeIdx(() => Math.min(3, Math.floor(intensity * 4)));
      setNetIdx((i) => (Math.random() > 0.7 ? (i + 1) % NET_STATES.length : i));
      setAiIdx(() => Math.min(3, Math.floor(intensity * 4)));
    }, 2200);
    return () => clearInterval(id);
  }, [intensity]);

  /* waveform canvas — amplitude & frequency scale with meter */
  const waveRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = waveRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let w = (canvas.width = canvas.offsetWidth);
    let h = (canvas.height = canvas.offsetHeight);
    const onResize = () => { w = canvas.width = canvas.offsetWidth; h = canvas.height = canvas.offsetHeight; };
    window.addEventListener('resize', onResize);
    let t = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      t += 0.05;
      ctx.clearRect(0, 0, w, h);
      const amp = 4 + intensity * (h * 0.32);
      const freq = 0.018 + intensity * 0.06;
      const chaos = intensity * 0.5;
      const mid = h / 2;
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = current.color;
      ctx.shadowBlur = 8 + intensity * 14;
      ctx.shadowColor = current.color;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const n = Math.sin(x * freq + t) * amp
          + Math.sin(x * freq * 2.3 + t * 1.7) * amp * 0.4 * (1 + chaos)
          + (Math.random() - 0.5) * amp * chaos * 0.5;
        const y = mid + n;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;
    };
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', onResize); };
  }, [intensity, current.color]);

  return (
    <section id="meter" ref={sectionRef} className="relative overflow-hidden px-5 pt-60 py-24">
      {/* static background image + readability overlays */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        aria-hidden
      />
      <div className="pointer-events-none absolute inset-0 bg-cyber-dark/70" aria-hidden />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'linear-gradient(180deg, rgba(0,240,255,0.06) 0%, transparent 40%, transparent 60%, rgba(0,240,255,0.04) 100%)' }}
        aria-hidden
      />

      <div data-depth="content" className="relative z-10 mx-auto max-w-3xl">
        <div data-depth="decorative" className="mb-12 text-center reveal-glitch">
          <div className="font-mono text-xs tracking-[0.4em] text-cyber-yellow animate-flicker">// LIVE DIAGNOSTIC</div>
          <h2 className="mt-3 font-display text-4xl font-black tracking-tight text-white sm:text-5xl">
            CYBERPSYCHO <span className="text-cyber-magenta text-glow-magenta rgb-hover">METER</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl font-body text-lg text-gray-400">
            Real-time measurement of your $CYBER-induced psychological state.
            The higher you go, the closer to flatline. No refunds on your humanity.
          </p>
        </div>

        {/* HUD bracket frame around the main card */}
        <div data-depth="content" className="relative reveal-pop">
          <HudBrackets intensity={intensity} />

          <div
            className="relative clip-cyber scan-card border border-cyber-magenta/40 bg-cyber-panel/70 p-8 backdrop-blur-sm"
            style={{ boxShadow: `0 0 ${12 + intensity * 28}px rgba(0,240,255,${0.2 + intensity * 0.3})` }}
          >
            {/* top status strip */}
            <div className="mb-6 flex items-center justify-between font-mono text-[10px] tracking-[0.3em] text-gray-500">
              <span className="flex items-center gap-2">
                <span className="hud-led" style={{ background: current.color, color: current.color }} />
                SUBJECT // 2077-NC-001
              </span>
              <span className="animate-flicker text-cyber-cyan/70">REC <span className="text-cyber-red">●</span></span>
            </div>

            {/* bar */}
            <div className="relative h-10 w-full overflow-hidden border border-cyber-cyan/30 bg-cyber-darker">
              <div
                className="h-full transition-all duration-100 ease-linear"
                style={{
                  width: `${level}%`,
                  background: `linear-gradient(90deg, #39FF14, #00F0FF, #FFE600, #FF00A8, #FF2D2D)`,
                  boxShadow: `0 0 20px ${current.color}`,
                }}
              />
              {[20, 40, 60, 80].map((tk) => (
                <div key={tk} className="absolute top-0 h-full w-px bg-cyber-dark/60" style={{ left: `${tk}%` }} />
              ))}
            </div>

            {/* waveform monitor */}
            <div className="relative mt-4 h-20 overflow-hidden border border-cyber-cyan/20 bg-cyber-darker/80">
              <div className="pointer-events-none absolute inset-0 opacity-30"
                   style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent 0, transparent 11px, rgba(0,240,255,0.08) 11px, rgba(0,240,255,0.08) 12px)' }} />
              <div className="pointer-events-none absolute inset-0 opacity-20"
                   style={{ backgroundImage: 'repeating-linear-gradient(90deg, transparent 0, transparent 19px, rgba(0,240,255,0.08) 19px, rgba(0,240,255,0.08) 20px)' }} />
              <canvas ref={waveRef} className="h-full w-full" aria-hidden />
              <div className="absolute left-2 top-1 font-mono text-[8px] tracking-[0.3em] text-cyber-cyan/60">NEURAL WAVEFORM</div>
              <div className="absolute right-2 top-1 font-mono text-[8px] tracking-[0.3em] text-cyber-magenta/60">
                {intensity > 0.7 ? 'UNSTABLE' : intensity > 0.4 ? 'ELEVATED' : 'STABLE'}
              </div>
              <div className="hud-blink-cursor absolute bottom-1 right-2 font-mono text-[8px] text-cyber-cyan/70" />
            </div>

            {/* readout */}
            <div className="mt-6 flex flex-col items-center gap-3 text-center">
              <div className="flex items-center gap-2">
                {level >= 90 ? (
                  <AlertTriangle className="h-6 w-6 animate-pulse text-cyber-red" />
                ) : level >= 70 ? (
                  <Zap className="h-6 w-6 text-cyber-yellow" />
                ) : (
                  <Brain className="h-6 w-6 text-cyber-cyan" />
                )}
                <span
                  className="font-display text-3xl font-black tracking-widest transition-colors"
                  style={{ color: current.color, textShadow: `0 0 12px ${current.color}` }}
                >
                  {current.label}
                </span>
              </div>
              <div className="font-mono text-2xl font-bold text-white">
                {Math.floor(level)}<span className="text-cyber-magenta">%</span>
              </div>
              <p className="font-body text-base text-gray-300">{current.desc}</p>
            </div>

            {/* manual override */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => setAuto(false)}
                className="clip-cyber-sm border border-cyber-cyan/40 bg-cyber-dark px-4 py-2 font-mono text-xs tracking-widest text-cyber-cyan transition-all hover:bg-cyber-cyan/10"
              >
                HOLD IT YOURSELF
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={level}
                onChange={(e) => { setAuto(false); setLevel(Number(e.target.value)); }}
                className="w-40 accent-cyber-magenta"
                aria-label="Cyberpsycho level"
              />
              <button
                onClick={() => setAuto(true)}
                className="clip-cyber-sm border border-cyber-magenta/40 bg-cyber-dark px-4 py-2 font-mono text-xs tracking-widest text-cyber-magenta transition-all hover:bg-cyber-magenta/10"
              >
                AUTO-PANIC
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* floating diagnostic widgets */}
      {WIDGETS.map((w, i) => {
        const val = w.key === 'me' ? MEME_LEVELS[memeIdx]
          : w.key === 'ns' ? NET_STATES[netIdx]
          : w.key === 'ai' ? AI_PREDS[aiIdx]
          : w.int ? Math.round(vitals[i]) : vitals[i].toFixed(1);
        return (
          <div
            key={w.key}
            className="hud-widget pointer-events-none absolute hidden md:block"
            style={{
              left: `${w.x}%`, top: `${w.y}%`,
              animationDuration: `${w.dur}s`, animationDelay: `${w.delay}s`,
              opacity: 0.45 + intensity * 0.15,
            }}
          >
            <div className="hud-widget-inner" style={{ borderColor: `${w.color}40` }}>
              <div className="flex items-center gap-1.5" style={{ color: w.color }}>
                <w.icon className="h-3 w-3" />
                <span className="font-mono text-[8px] tracking-[0.25em]">{w.label}</span>
              </div>
              <div className="mt-1 font-mono text-sm font-bold" style={{ color: w.color, textShadow: `0 0 6px ${w.color}80` }}>
                {val}{w.unit && <span className="ml-0.5 text-[10px] opacity-70">{w.unit}</span>}
              </div>
            </div>
          </div>
        );
      })}

      {/* scattered status indicators */}
      {STATUS_INDICATORS.map((s, i) => (
        <div
          key={s.text}
          className="hud-status pointer-events-none absolute hidden md:flex"
          style={{ left: `${s.x}%`, top: `${s.y}%`, animationDelay: `${i * 0.4}s` }}
        >
          <span className={s.blink ? 'hud-status-dot hud-status-blink' : 'hud-status-dot'} style={{ animationDelay: `${i * 0.3}s` }} />
          <span>{s.text}</span>
        </div>
      ))}

      <HudStyles />
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HUD BRACKETS — animated corner frame around the main card
   ═══════════════════════════════════════════════════════════════════ */

function HudBrackets({ intensity }: { intensity: number }) {
  const glow = `rgba(0,240,255,${0.4 + intensity * 0.4})`;
  const bracket = 'absolute h-5 w-5';
  return (
    <>
      <div className={`${bracket} -left-1 -top-1 border-l-2 border-t-2`} style={{ borderColor: glow, boxShadow: `0 0 8px ${glow}` }} />
      <div className={`${bracket} -right-1 -top-1 border-r-2 border-t-2`} style={{ borderColor: glow, boxShadow: `0 0 8px ${glow}` }} />
      <div className={`${bracket} -bottom-1 -left-1 border-b-2 border-l-2`} style={{ borderColor: glow, boxShadow: `0 0 8px ${glow}` }} />
      <div className={`${bracket} -bottom-1 -right-1 border-b-2 border-r-2`} style={{ borderColor: glow, boxShadow: `0 0 8px ${glow}` }} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   HUD STYLES — keyframes + classes for HUD widgets and indicators
   ═══════════════════════════════════════════════════════════════════ */

function HudStyles() {
  return (
    <style>{`
@keyframes hudWidgetDrift {
  0%, 100% { transform: translate(0, 0); }
  50% { transform: translate(6px, -4px); }
}
@keyframes hudLedPulse {
  0%, 100% { opacity: 0.4; box-shadow: 0 0 2px currentColor; }
  50% { opacity: 1; box-shadow: 0 0 6px currentColor, 0 0 12px currentColor; }
}
@keyframes hudStatusBlink {
  0%, 45% { opacity: 0.85; }
  50%, 100% { opacity: 0.2; }
}
@keyframes hudBlinkCursor {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}

.hud-widget {
  animation: hudWidgetDrift 10s ease-in-out infinite;
  will-change: transform, opacity;
  z-index: 5;
}
.hud-widget-inner {
  padding: 6px 10px;
  border: 1px solid;
  background: rgba(8,10,18,0.55);
  backdrop-filter: blur(2px);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%);
}
.hud-led { width: 6px; height: 6px; border-radius: 50%; animation: hudLedPulse 2s ease-in-out infinite; }
.hud-status {
  align-items: center; gap: 4px;
  font-family: 'Share Tech Mono', monospace;
  font-size: 8px; letter-spacing: 0.25em;
  color: rgba(0,240,255,0.4);
  z-index: 5;
}
.hud-status-dot {
  width: 4px; height: 4px; border-radius: 50%;
  background: rgba(57,255,20,0.7); box-shadow: 0 0 4px rgba(57,255,20,0.6);
}
.hud-status-blink { animation: hudStatusBlink 1.6s steps(1) infinite; }
.hud-blink-cursor::after { content: '_'; animation: hudBlinkCursor 1s steps(2) infinite; }

@media (prefers-reduced-motion: reduce) {
  .hud-widget { animation: none !important; }
}
`}</style>
  );
}
