import { memo, useEffect, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { Rocket, Skull, Music, Globe, ArrowLeft, ArrowRight } from 'lucide-react';
import ShuffleText from './ShuffleText';

gsap.registerPlugin(Draggable, InertiaPlugin);

interface Phase {
  phase: string;
  title: string;
  status: string;
  icon: typeof Rocket;
  colorKey: 'green' | 'cyan' | 'magenta' | 'yellow';
  hex: string;
  image: string;
  points: string[];
}

const PHASES: Phase[] = [
  {
    phase: 'PHASE 01',
    title: 'JACK IN',
    status: 'COMPLETE',
    icon: Rocket,
    colorKey: 'green',
    hex: '#39FF14',
    image: 'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/2/a.webp',
    points: [
      'Stealth launch on the streets of Night City',
      'Liquidity locked, contract renounced',
      'First 1,000 cybers onboarded — no KYC, no mercy',
    ],
  },
  {
    phase: 'PHASE 02',
    title: 'OVERCLOCK',
    status: 'IN PROGRESS',
    icon: Skull,
    colorKey: 'cyan',
    hex: '#00F0FF',
    image: 'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/davidNlucy.webp',
    points: [
      'CoinGecko + CMC listings',
      'Meme bounty board goes live',
      'Influencer raids across the net',
      'First scheduled burn event',
    ],
  },
  {
    phase: 'PHASE 03',
    title: 'CYBERPSYCHO',
    status: 'QUEUED',
    icon: Music,
    colorKey: 'magenta',
    hex: '#FF00A8',
    image: 'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/2/MV5BODU3NTA3ZWQtNDkyZi00NjM2LWI1NDUtNjBlNGVmZmQ0NGZjXkEyXkFqcGc@._V1_.webp',
    points: [
      'NFT collection: "Ripperdoc Rarities"',
      'Holder-gated Samurai Sessions (audio drops)',
      'CEX listings — tier 1 exchanges',
      'Massive 6.9% supply burn on-chain',
    ],
  },
  {
    phase: 'PHASE 04',
    title: 'FLATLINE / REBOOT',
    status: 'CLASSIFIED',
    icon: Globe,
    colorKey: 'yellow',
    hex: '#FFE600',
    image: 'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/psycho.webp',
    points: [
      'CyberDAO governance launch',
      'Cross-chain bridge to the metaverse',
      'IRL Night City meetups (we wish)',
      'The moon. Obviously the moon.',
    ],
  },
];

const GAP = 32;

const hexToRgb = (hex: string) => {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `${r}, ${g}, ${b}`;
};

type Setter = (v: number | string) => void;
interface CardFx { scale: Setter; rot: Setter; opacity: Setter; blur: Setter; glow: Setter; z: Setter }
type Mode = 'idle' | 'drag' | 'snap';

export default function Roadmap() {
  const sectionRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardEls = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  const fxRef = useRef<(CardFx | null)[]>([]);
  const mobileRef = useRef(false);
  const dragRef = useRef<Draggable | null>(null);
  const snapTweenRef = useRef<gsap.core.Tween | null>(null);
  const xRef = useRef(0);
  const targetXRef = useRef(0);
  const modeRef = useRef<Mode>('idle');
  const rafRef = useRef<number | null>(null);
  const dimsRef = useRef({ cardW: 0, step: 0, minX: 0, maxX: 0, wrapW: 0 });
  const lastBaseIdxRef = useRef(-1);

  const measure = () => {
    const wrap = wrapRef.current;
    const first = cardEls.current[0];
    if (!wrap || !first) return;
    const cardW = first.offsetWidth;
    const wrapW = wrap.offsetWidth;
    const step = cardW + GAP;
    const maxX = (wrapW - cardW) / 2;
    const minX = maxX - step * (PHASES.length - 1);
    dimsRef.current = { cardW, step, minX, maxX, wrapW };
  };

  const posX = (i: number) => dimsRef.current.maxX - i * dimsRef.current.step;
  const nearestIdx = (x: number, threshold = 0.5) =>
    Math.max(0, Math.min(PHASES.length - 1, Math.floor((dimsRef.current.maxX - x) / dimsRef.current.step + (1 - threshold))));

  // Pure visual update — never writes the track's `x`, only per-card effects.
  // NEVER calls setActive — visual transforms are DOM-only. React state (the active
  // index) is flipped at snap start in snapTo, not here.
  // On mobile: only update active + adjacent cards, with reduced 3D math, no z/blur/glow.
  // Caches last base index to skip recomputation when dragging within the same card.
  const updateFx = (x: number, force = false) => {
    const { cardW, step, wrapW, maxX } = dimsRef.current;
    const center = wrapW / 2;
    const mobile = mobileRef.current;
    const baseIdx = Math.round((maxX - x) / step);

    // Mobile cache: skip recomputation if same card and not snapping
    if (mobile && !force && lastBaseIdxRef.current === baseIdx && modeRef.current !== 'snap') return;
    lastBaseIdxRef.current = baseIdx;

    const indices = mobile
      ? [baseIdx - 1, baseIdx, baseIdx + 1].filter((i) => i >= 0 && i < PHASES.length)
      : PHASES.map((_, i) => i);
    indices.forEach((i) => {
      const card = cardEls.current[i];
      const fx = fxRef.current[i];
      if (!card || !fx) return;
      const cardCenter = x + i * step + cardW / 2;
      const dist = Math.abs(center - cardCenter);
      const n = Math.min(1, dist / step);
      const isLeft = cardCenter < center;
      if (mobile) {
        fx.scale(1 - n * 0.06);
        fx.opacity(1 - n * 0.45);
        fx.rot(n * 4.5 * (isLeft ? -1 : 1));
      } else {
        fx.scale(1 - n * 0.12);
        fx.opacity(1 - n * 0.45);
        fx.rot(n * 9 * (isLeft ? -1 : 1));
        fx.blur(`blur(${(n * 3).toFixed(2)}px)`);
        fx.glow(`${(n * 0.16).toFixed(3)}`);
        fx.z((1 - n) * 60);
      }
    });
  };

  // Flip data-current on the settled card via direct DOM writes — never React.
  // React's `active` state drives only indicators/arrows (immediate); this
  // attribute drives heavy decorative effects (glow, zoom, HUD, pulse, bullets)
  // and is set only after the snap tween settles, so no style recalc/repaint
  // fires mid-animation. React never re-writes it because its JSX value is a
  // constant per card index.
  const setCurrent = (idx: number) => {
    cardEls.current.forEach((el, i) => {
      if (el) el.dataset.current = i === idx ? 'true' : 'false';
    });
  };

  const snapTo = (idx: number) => {
    const track = trackRef.current;
    if (!track || dragRef.current?.isDragging) return;
    dragRef.current?.tween?.kill();
    snapTweenRef.current?.kill();
    targetXRef.current = posX(idx);
    modeRef.current = 'snap';
    // Semantic state flips the instant navigation begins so indicators and
    // arrow disabled-state track the destination immediately. Heavy visual
    // effects are NOT driven by this — they wait for data-current, flipped in
    // onComplete after the snap settles, so no style recalc/repaint fires
    // mid-animation.
    if (activeRef.current !== idx) { activeRef.current = idx; setActive(idx); }
    const mobile = mobileRef.current;
    snapTweenRef.current = gsap.to(xRef, {
      current: targetXRef.current,
      duration: mobile ? 0.5 : 0.9,
      ease: mobile ? 'power2.out' : 'power3.out',
      onUpdate: () => { gsap.set(track, { x: xRef.current }); updateFx(xRef.current, true); },
      onComplete: () => {
        snapTweenRef.current = null;
        modeRef.current = 'idle';
        lastBaseIdxRef.current = idx;
        setCurrent(idx);
        sectionRef.current?.classList.remove('rm-dragging');
      },
    });
  };

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    measure();

    const isMobile = window.matchMedia('(pointer: coarse)').matches;
    mobileRef.current = isMobile;

    // Preload all roadmap images so the browser doesn't decode during swipe
    PHASES.forEach((p) => {
      const img = new Image();
      img.src = p.image;
    });

    fxRef.current = cardEls.current.map((card) => {
      if (!card) return null;
      return {
        scale: gsap.quickSetter(card, 'scale'),
        rot: gsap.quickSetter(card, 'rotationY', 'deg'),
        opacity: gsap.quickSetter(card, 'opacity'),
        blur: isMobile ? (() => {}) : gsap.quickSetter(card, 'filter'),
        glow: gsap.quickSetter(card, '--glow'),
        z: isMobile ? (() => {}) : gsap.quickSetter(card, 'z', 'px'),
      } as CardFx;
    });

    const startX = posX(0);
    xRef.current = startX;
    targetXRef.current = startX;
    gsap.set(track, { x: startX });
    updateFx(startX);
    setCurrent(activeRef.current);

    // Single rAF loop — LERPs toward target during snap, reads Draggable's x during drag/throw.
    const tick = () => {
      rafRef.current = requestAnimationFrame(tick);
      const m = modeRef.current;
      if (m === 'snap') {
        // gsap.to drives xRef; just keep the DOM + visuals in sync.
        gsap.set(track, { x: xRef.current });
        updateFx(xRef.current);
      } else if (m === 'drag') {
        updateFx(xRef.current);
      }
    };
    rafRef.current = requestAnimationFrame(tick);

    const drag = Draggable.create(track, {
      type: 'x',
      inertia: true,
      edgeResistance: isMobile ? 0.4 : 0.92,
      dragResistance: isMobile ? 0.01 : 0.02,
      minimumMovement: 3,
      throwResistance: isMobile ? 200 : 1400,
      allowNativeTouchScrolling: isMobile,
      bounds: { minX: dimsRef.current.minX - 50, maxX: dimsRef.current.maxX + 50 },
      onPress: () => {
        snapTweenRef.current?.kill(); snapTweenRef.current = null;
        modeRef.current = 'drag';
        if (isMobile) sectionRef.current?.classList.add('rm-dragging');
      },
      onDrag: () => { xRef.current = gsap.getProperty(track, 'x') as number; },
      onThrowUpdate: () => { xRef.current = gsap.getProperty(track, 'x') as number; },
      onThrowComplete: () => { modeRef.current = 'idle'; snapTo(nearestIdx(xRef.current, isMobile ? 0.35 : 0.5)); },
    })[0];
    dragRef.current = drag;

    let rt: number | null = null;
    const onResize = () => {
      if (rt != null) clearTimeout(rt);
      rt = window.setTimeout(() => {
        snapTweenRef.current?.kill(); snapTweenRef.current = null;
        dragRef.current?.tween?.kill();
        measure();
        const t = posX(activeRef.current);
        xRef.current = t; targetXRef.current = t;
        gsap.set(track, { x: t });
        modeRef.current = 'idle';
        updateFx(t);
        dragRef.current?.applyBounds({ minX: dimsRef.current.minX - 50, maxX: dimsRef.current.maxX + 50 });
      }, 150);
    };
    window.addEventListener('resize', onResize);

    // Pause rAF + CSS animations when section is offscreen
    const section = sectionRef.current;
    let visObs: IntersectionObserver | null = null;
    if (section) {
      visObs = new IntersectionObserver((entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          section.classList.remove('rm-offscreen');
          if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
        } else {
          section.classList.add('rm-offscreen');
          if (rafRef.current != null) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        }
      }, { threshold: 0.05 });
      visObs.observe(section);
    }

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      snapTweenRef.current?.kill();
      window.removeEventListener('resize', onResize);
      visObs?.disconnect();
      drag.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goPrev = () => active > 0 && snapTo(active - 1);
  const goNext = () => active < PHASES.length - 1 && snapTo(active + 1);

  return (
    <section id="roadmap" ref={sectionRef} className="relative overflow-hidden py-24">
      <RoadmapBackground />

      <div className="relative z-10 mb-12 text-center">
        <div className="font-mono text-xs tracking-[0.4em] text-cyber-green animate-flicker">// THE MISSION LOG</div>
        <ShuffleText
  text="ROADMAP"
  as="h2"
  className="
    reveal-glitch
    mt-3
    font-display
    text-4xl
    font-black
    tracking-tight
    text-cyber-green
    drop-shadow-[0_0_12px_#39FF14]
    sm:text-5xl
  "
/>
        <p className="mx-auto mt-5 max-w-xl font-body text-lg text-gray-400">
          We don't make promises. We make threats. Here's the plan — subject to cyberpsycho disruption.
        </p>
      </div>

      {/* progress indicators + arrows */}
      <div className="relative z-10 mb-8 flex items-center justify-center gap-6">
        <button onClick={goPrev} disabled={active === 0}
          className="rm-arrow group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-white/5"
          aria-label="Previous phase">
          <ArrowLeft className="h-4 w-4 text-cyber-cyan transition-transform group-hover:-translate-x-0.5" />
        </button>

        <div className="flex items-center gap-3">
          {PHASES.map((p, i) => (
            <button key={i} onClick={() => snapTo(i)} className="group flex items-center" aria-label={`Go to ${p.title}`}>
              <span className="h-1.5 rounded-full transition-all duration-500"
                style={{
                  width: active === i ? 36 : 12,
                  background: active === i ? p.hex : 'rgba(255,255,255,0.2)',
                  boxShadow: active === i ? `0 0 8px ${p.hex}` : 'none',
                }} />
            </button>
          ))}
        </div>

        <button onClick={goNext} disabled={active === PHASES.length - 1}
          className="rm-arrow group flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-all hover:border-cyber-cyan/50 hover:bg-cyber-cyan/10 disabled:opacity-20 disabled:hover:border-white/10 disabled:hover:bg-white/5"
          aria-label="Next phase">
          <ArrowRight className="h-4 w-4 text-cyber-cyan transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* draggable viewport */}
      <div ref={wrapRef} className="rm-viewport relative z-10 h-[640px] w-full overflow-hidden cursor-grab active:cursor-grabbing"
        style={{ perspective: '1600px' }}>
        <div ref={trackRef} className="absolute top-0 left-0 flex h-full items-center"
          style={{ gap: `${GAP}px`, willChange: 'transform', transformStyle: 'preserve-3d' }}>
          {PHASES.map((p, i) => {
            const cardStyle = {
              width: 'min(80vw, 920px)',
              transformStyle: 'preserve-3d',
            } as CSSProperties;
            (cardStyle as Record<string, unknown>)['--card-hex'] = p.hex;
            (cardStyle as Record<string, unknown>)['--card-rgb'] = hexToRgb(p.hex);
            return (
              <div key={i} ref={(el) => { cardEls.current[i] = el; }}
                className="rm-card relative h-[600px] shrink-0"
                data-current={i === 0 ? 'true' : 'false'}
                style={cardStyle}>
                <RoadmapCard phase={p} />
              </div>
            );
          })}
        </div>

        <div className="pointer-events-none absolute inset-y-0 left-0 z-20 w-24 bg-gradient-to-r from-cyber-darker to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-20 w-24 bg-gradient-to-l from-cyber-darker to-transparent" />
      </div>

      <p className="relative z-10 mt-6 text-center font-mono text-xs tracking-[0.3em] text-gray-500">
        DRAG · SWIPE · USE THE ARROWS
      </p>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ROADMAP CARD
   ═══════════════════════════════════════════════════════════════════ */

const RoadmapCard = memo(function RoadmapCard({ phase }: { phase: Phase }) {
  const { hex, colorKey } = phase;
  const textCls = `text-cyber-${colorKey}`;

  return (
    <div className="rm-card-inner clip-cyber relative h-full w-full border bg-cyber-panel/40 backdrop-blur-md">
      {/* image hero */}
      <div className="rm-img-wrap relative h-[65%] w-full overflow-hidden">
        <img src={phase.image} alt={phase.title} loading="eager"
          className="rm-img h-full w-full object-cover"
          style={{ objectPosition: 'center 20%' }} />
        <div className="rm-scanlines pointer-events-none absolute inset-0" />
        <div className="rm-sweep pointer-events-none absolute inset-0" />
        <div className="rm-img-glow pointer-events-none absolute inset-0" />
        <div className="rm-noise pointer-events-none absolute inset-0 opacity-[0.06]" />
        {[...Array(6)].map((_, k) => (
          <span key={k} className="rm-particle pointer-events-none absolute rounded-full"
            style={{ left: `${15 + k * 14}%`, top: `${20 + (k % 3) * 25}%`, width: 2, height: 2,
              background: hex, boxShadow: `0 0 6px ${hex}`,
              animationDelay: `${k * 1.3}s`, animationDuration: `${7 + k}s` }} />
        ))}
        <HudCorners />
        <div className="pointer-events-none absolute left-6 top-5 font-display text-6xl font-black leading-none"
          style={{ color: `${hex}30`, textShadow: `0 0 20px ${hex}50` }}>
          {phase.phase.split(' ')[1]}
        </div>
      </div>

      {/* info panel */}
      <div className="rm-info-panel relative h-[35%] w-full px-7 py-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <phase.icon className={`h-5 w-5 ${textCls}`} />
              <span className="font-mono text-xs tracking-[0.3em] text-gray-400">{phase.phase}</span>
            </div>
            <h3 className={`mt-2 font-display text-3xl font-black tracking-wide ${textCls}`}
              style={{ textShadow: `0 0 12px ${hex}80` }}>{phase.title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rm-status h-2.5 w-2.5 rounded-full"
              style={{ background: hex, boxShadow: `0 0 8px ${hex}` }} />
            <span className="font-mono text-[10px] tracking-[0.25em]" style={{ color: hex }}>{phase.status}</span>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5">
          {phase.points.map((pt, j) => (
            <li key={j} className="rm-bullet flex items-start gap-2 font-body text-sm text-gray-300"
              style={{ animationDelay: `${j * 120}ms` }}>
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full" style={{ background: hex, boxShadow: `0 0 4px ${hex}` }} />
              <span>{pt}</span>
            </li>
          ))}
        </ul>

        <div className="rm-enter-sector absolute bottom-5 right-6 flex items-center gap-1.5 font-mono text-[10px] tracking-[0.25em]" style={{ color: hex }}>
          ENTER SECTOR <ArrowRight className="h-3.5 w-3.5" />
        </div>
      </div>
    </div>
  );
});

function HudCorners() {
  const base = 'rm-hud-corner absolute h-6 w-6';
  return (
    <>
      <div className={`${base} left-3 top-3 border-l-2 border-t-2`} />
      <div className={`${base} right-3 top-3 border-r-2 border-t-2`} />
      <div className={`${base} bottom-3 left-3 border-b-2 border-l-2`} />
      <div className={`${base} bottom-3 right-3 border-b-2 border-r-2`} />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BACKGROUND + STYLES
   ═══════════════════════════════════════════════════════════════════ */

function RoadmapBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      <div className="rm-bg-grid absolute inset-0" />
      <div className="rm-bg-aurora absolute" style={{ background: 'radial-gradient(circle at 25% 40%, rgba(57,255,20,0.06), transparent 55%)', animationDuration: '28s' }} />
      <div className="rm-bg-aurora absolute" style={{ background: 'radial-gradient(circle at 75% 60%, rgba(255,0,168,0.06), transparent 55%)', animationDuration: '34s', animationDelay: '-8s' }} />
      {[...Array(10)].map((_, i) => (
        <span key={i} className="rm-bg-particle absolute rounded-full"
          style={{ left: `${8 + i * 9}%`, top: `${15 + (i % 4) * 22}%`, width: 2, height: 2,
            background: 'rgba(0,240,255,0.4)', boxShadow: '0 0 4px rgba(0,240,255,0.4)',
            animationDuration: `${8 + i}s`, animationDelay: `${i * 0.7}s` }} />
      ))}
      <RoadmapStyles />
    </div>
  );
}

function RoadmapStyles() {
  return (
    <style>{`
@keyframes rmBgGridDrift { 0% { background-position: 0 0; } 100% { background-position: 60px 60px; } }
@keyframes rmBgAuroraDrift {
  0% { transform: translate(0,0) scale(1); opacity: 0.5; }
  50% { transform: translate(40px,-30px) scale(1.15); opacity: 0.8; }
  100% { transform: translate(-30px,20px) scale(0.95); opacity: 0.55; }
}
@keyframes rmBgParticleFloat {
  0%,100% { transform: translateY(0) translateX(0); opacity: 0.3; }
  50% { transform: translateY(-20px) translateX(6px); opacity: 0.6; }
}
@keyframes rmImgZoom { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes rmImgEnter { 0% { opacity: 0.45; transform: scale(0.94); } 100% { opacity: 1; transform: scale(1); } }
@keyframes rmSweep { 0% { transform: translateX(-120%) skewX(-15deg); } 100% { transform: translateX(220%) skewX(-15deg); } }
@keyframes rmParticleFloat {
  0%,100% { transform: translateY(0); opacity: 0.4; }
  50% { transform: translateY(-18px); opacity: 0.8; }
}
@keyframes rmStatusPulse {
  0%,100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.3); }
}
@keyframes rmBulletIn {
  0% { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

.rm-bg-grid {
  background-image:
    linear-gradient(rgba(0,240,255,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,0.04) 1px, transparent 1px);
  background-size: 60px 60px;
  mask-image: radial-gradient(ellipse at 50% 50%, black 25%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse at 50% 50%, black 25%, transparent 80%);
  animation: rmBgGridDrift 40s linear infinite;
}
.rm-bg-aurora { inset: -20%; filter: blur(80px); animation: rmBgAuroraDrift 30s ease-in-out infinite alternate; }
.rm-bg-particle { animation: rmBgParticleFloat 9s ease-in-out infinite; }

.rm-img-wrap { transform: translateZ(20px); }
.rm-img { transition: transform 0.8s ease; }
.rm-card:hover .rm-img { transform: scale(1.05); }
/* Active image zoom — driven by data-current (set after snap settles) */
.rm-card[data-current="true"] .rm-img { animation: rmImgZoom 14s ease-in-out infinite; }

.rm-scanlines {
  background: repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.25) 3px, rgba(0,0,0,0.25) 4px);
  mix-blend-mode: multiply;
}
.rm-sweep {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent);
  width: 40%;
  animation: rmSweep 7s ease-in-out infinite;
  animation-delay: 3s;
}
.rm-noise {
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}
.rm-particle { animation: rmParticleFloat 8s ease-in-out infinite; }

/* Inner card glow + border — driven by --card-rgb + data-current.
   No box-shadow/border transition: those are repaint-heavy and would animate
   during/after the snap. data-current flips once, post-snap, with no transition. */
.rm-card-inner {
  border-color: rgba(var(--card-rgb), 0.25);
}
.rm-img-glow {
  box-shadow: inset 0 0 60px rgba(var(--card-rgb), 0.25), inset 0 0 120px rgba(var(--card-rgb), 0.125);
  pointer-events: none;
}
.rm-card[data-current="true"] .rm-card-inner {
  box-shadow: 0 0 40px rgba(var(--card-rgb), 0.25), 0 0 80px rgba(var(--card-rgb), 0.125), inset 0 0 40px rgba(var(--card-rgb), 0.06);
}
.rm-card:not([data-current="true"]) .rm-card-inner {
  box-shadow: 0 0 20px rgba(var(--card-rgb), 0.125), inset 0 0 20px rgba(var(--card-rgb), 0.03);
}

/* HUD corner brackets — driven by --card-hex + data-current */
.rm-hud-corner { border-color: var(--card-hex); transition: opacity 0.5s ease; }
.rm-card[data-current="true"] .rm-hud-corner { opacity: 1; box-shadow: 0 0 8px var(--card-hex); }
.rm-card:not([data-current="true"]) .rm-hud-corner { opacity: 0.5; box-shadow: none; }

/* Status LED — infinite pulse only on the current card */
.rm-card[data-current="true"] .rm-status { animation: rmStatusPulse 1.6s ease-in-out infinite; }

/* Bullets — entrance animation only on the current card */
.rm-bullet { opacity: 0; transform: translateY(12px); }
.rm-card[data-current="true"] .rm-bullet { animation: rmBulletIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards; }

.rm-card { transform-style: preserve-3d; }
.rm-card[data-current="true"]:hover .rm-card-inner { filter: brightness(1.05); }

@media (prefers-reduced-motion: reduce) {
  .rm-bg-grid, .rm-bg-aurora, .rm-bg-particle, .rm-sweep, .rm-particle { animation: none !important; }
  .rm-card[data-current="true"] .rm-img,
  .rm-card[data-current="true"] .rm-status,
  .rm-card[data-current="true"] .rm-bullet { animation: none !important; }
  .rm-bullet { opacity: 1; transform: none; }
}

/* Offscreen: pause all CSS animations to save GPU */
.rm-offscreen .rm-bg-grid,
.rm-offscreen .rm-bg-aurora,
.rm-offscreen .rm-bg-particle,
.rm-offscreen .rm-sweep,
.rm-offscreen .rm-particle { animation-play-state: paused !important; }
.rm-offscreen .rm-card[data-current="true"] .rm-img,
.rm-offscreen .rm-card[data-current="true"] .rm-status,
.rm-offscreen .rm-card[data-current="true"] .rm-bullet { animation-play-state: paused !important; }

/* Mobile-only (pointer: coarse) optimizations */
@media (pointer: coarse) {
  .rm-viewport { height: 480px !important; }
  .rm-card { height: 440px !important; }
  .rm-img-wrap { height: 55% !important; }
  .rm-info-panel { height: 45% !important; padding-top: 14px !important; padding-bottom: 14px !important; }
  .rm-card-inner { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; transition: none !important; }
  .rm-scanlines { mix-blend-mode: normal !important; }
  .rm-bg-grid { animation: none !important; }
  .rm-enter-sector { position: static !important; justify-content: flex-end !important; padding-top: 8px !important; }

  /* Strip heavy animated decorative layers — mobile GPU is the bottleneck.
     Keep only image, neon border, scale, opacity, slight rotation. */
  .rm-sweep, .rm-noise, .rm-particle, .rm-bg-aurora { display: none !important; }

  /* One-time entrance fade/scale instead of infinite zoom */
  .rm-card[data-current="true"] .rm-img { animation: rmImgEnter 0.6s ease-out forwards !important; }

  /* No infinite status pulse on mobile */
  .rm-card[data-current="true"] .rm-status { animation: none !important; }

  /* Single-light box-shadow instead of multi-layer glow */
  .rm-card[data-current="true"] .rm-card-inner { box-shadow: 0 0 18px rgba(var(--card-rgb), 0.22) !important; }
  .rm-card:not([data-current="true"]) .rm-card-inner { box-shadow: 0 0 8px rgba(var(--card-rgb), 0.10) !important; }

  /* Bullet text always visible — no entrance animation on mobile */
  .rm-bullet {
    opacity: 1 !important;
    transform: none !important;
    animation: none !important;
    transition: none !important;
  }

  /* Disable hover-only effects — touch devices don't hover */
  .rm-card:hover .rm-img { transform: none !important; }
  .rm-card[data-current="true"]:hover .rm-card-inner { filter: none !important; }

  /* Pause remaining animations during drag/throw/snap */
  .rm-dragging .rm-card[data-current="true"] .rm-img,
  .rm-dragging .rm-card[data-current="true"] .rm-status,
  .rm-dragging .rm-card[data-current="true"] .rm-bullet { animation-play-state: paused !important; }
}
`}</style>
  );
}
