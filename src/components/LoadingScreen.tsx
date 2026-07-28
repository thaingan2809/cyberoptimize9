import { useEffect, useRef, useState } from 'react';

const BG_IMAGE =
  'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/loadingBackground.webp';
const SOUND_URL = 'https://ik.imagekit.io/zznoau6lx/loading.mp3';

const MESSAGES = [
  'Initializing Neural Link...',
  'Loading City Assets...',
  'Synchronizing Memory...',
  'Decrypting Network...',
  'Connecting to Night City...',
  'Booting Interface...',
  'Preparing Environment...',
  'Verifying Identity...',
];

const SEGMENTS = 20;
const COLLAPSE_MS = 2500;

export default function LoadingScreen({ onEnter }: { onEnter: () => void }) {
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [collapsing, setCollapsing] = useState(false);
  const [messageIdx, setMessageIdx] = useState(0);
  const enteredRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Believable game-style loading: fast start, brief pause ~40%, tiny pause
  // ~75%, then clean finish. Total duration ~2.5-3s.
  useEffect(() => {
    let raf = 0;
    let target = 0;
    let current = 0;
    let lastStep = performance.now();
    let nextDelay = 90;

    const tick = (now: number) => {
      if (now - lastStep >= nextDelay && target < 100) {
        lastStep = now;
        let inc: number;
        if (target < 35) inc = 7 + Math.random() * 8;
        else if (target < 50) inc = 1.5 + Math.random() * 2.5;
        else if (target < 72) inc = 5 + Math.random() * 6;
        else if (target < 78) inc = 0.6 + Math.random() * 1.2;
        else inc = 4 + Math.random() * 7;

        target = Math.min(100, target + inc);

        if (target < 35) nextDelay = 55 + Math.random() * 70;
        else if (target < 50) nextDelay = 260 + Math.random() * 320;
        else if (target < 72) nextDelay = 80 + Math.random() * 120;
        else if (target < 78) nextDelay = 420 + Math.random() * 380;
        else nextDelay = 60 + Math.random() * 100;
      }

      current += (target - current) * 0.20;
      if (target >= 100 && current > 99.95) current = 100;

      setProgress(current);

      if (current < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setDone(true);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Rotate loading messages independently of progress speed
  useEffect(() => {
    if (done) return;
    const id = window.setInterval(() => {
      setMessageIdx((i) => (i + 1) % MESSAGES.length);
    }, 380);
    return () => clearInterval(id);
  }, [done]);

  // Preload the enter sound once so playback starts instantly on press
  // instead of decoding the MP3 mid-collapse (which causes a runtime hitch).
  useEffect(() => {
    const audio = new Audio(SOUND_URL);
    audio.preload = 'auto';
    audioRef.current = audio;
    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const finish = () => {
    if (enteredRef.current) return;
    enteredRef.current = true;
    onEnter();
  };

  const handleEnter = () => {
    if (collapsing) return;
    setCollapsing(true);
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
      audio.addEventListener('ended', finish, { once: true });
    }
    // Fallback in case the 'ended' event never fires.
    window.setTimeout(finish, COLLAPSE_MS + 400);
  };

  const pct = Math.floor(progress).toString().padStart(3, '0');
  const filledSegments = Math.round((progress / 100) * SEGMENTS);

  return (
    <div
      className="boot-screen fixed inset-0 z-[10000] overflow-hidden"
      data-collapse={collapsing ? 'on' : 'off'}
    >
      {/* Background plate — clean, sharp, cinematic */}
      <img
        src={BG_IMAGE}
        alt=""
        className="boot-bg absolute inset-0 h-full w-full object-cover"
        style={{ filter: 'brightness(0.55) saturate(1.05)' }}
      />
      {/* Subtle dark overlay */}
      <div className="boot-overlay absolute inset-0 bg-black/25" />
      {/* Soft vignette */}
      <div
        className="boot-vignette absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.7) 100%)',
        }}
      />
      {/* Very light film grain */}
      <div className="boot-grain absolute inset-0" />
      {/* Horizontal tear lines (only visible during collapse) */}
      <div className="boot-tears absolute inset-0">
        <span className="boot-tear boot-tear-1" />
        <span className="boot-tear boot-tear-2" />
        <span className="boot-tear boot-tear-3" />
      </div>
      {/* Scanning interference line during collapse */}
      <div className="boot-scanline absolute inset-0" />

      {/* Centered loading UI — floats directly on the background */}
      <div className="boot-ui absolute inset-0 flex flex-col items-center justify-center px-6">
        {!done ? (
          <div className="flex w-full max-w-md flex-col items-center">
            {/* Loading message above the bar — ~30% larger */}
            <div className="mb-5 h-5 font-mono text-[14px] tracking-[0.3em] text-cyber-cyan/85">
              {MESSAGES[messageIdx]}
              <span className="boot-cursor" />
            </div>

            {/* Segmented neon loading bar */}
            <div className="relative flex w-full items-center gap-[3px]">
              {Array.from({ length: SEGMENTS }).map((_, i) => (
                <div
                  key={i}
                  className="boot-segment relative h-[14px] flex-1"
                  style={{
                    background:
                      i < filledSegments
                        ? 'linear-gradient(180deg, #00F0FF, rgba(0,240,255,0.7))'
                        : 'rgba(0,240,255,0.06)',
                    boxShadow:
                      i < filledSegments
                        ? '0 0 8px rgba(0,240,255,0.7), 0 0 16px rgba(0,240,255,0.3)'
                        : 'none',
                    transition: 'background 0.12s ease, box-shadow 0.12s ease',
                    animationDelay: `${i * 0.04}s`,
                  }}
                />
              ))}
              {/* Energy sweep across the bar */}
              <div className="boot-sweep pointer-events-none absolute inset-0" />
            </div>

            {/* Percentage below the bar — ~30% larger */}
            <div className="mt-4 font-mono text-[16px] tracking-[0.35em] text-cyber-cyan">
              {pct}%
            </div>
          </div>
        ) : (
          <button onClick={handleEnter} className="enter-btn">
            ENTER NIGHT CITY
          </button>
        )}
      </div>

      <style>{`
.boot-screen { background: #050507; }
.boot-grain {
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>");
  opacity: 0.5; pointer-events: none; mix-blend-mode: overlay;
}
.boot-segment { border-radius: 1px; }
.boot-sweep::after {
  content: '';
  position: absolute; top: 0; left: 0; height: 100%; width: 40%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  animation: bootSweep 1.8s ease-in-out infinite;
}
@keyframes bootSweep {
  0% { left: -40%; }
  100% { left: 100%; }
}
.boot-cursor::after { content:'_'; color:#00F0FF; animation: bootBlink 1s steps(2) infinite; margin-left:2px; }
@keyframes bootBlink { 0%,49%{opacity:1;} 50%,100%{opacity:0;} }

.enter-btn {
  font-family: 'Orbitron', sans-serif;
  font-weight: 600;
  font-size: 22px;
  letter-spacing: 0.5em;
  color: #B0FAFF;
  background: rgba(0,240,255,0.04);
  border: 1px solid rgba(0,240,255,0.6);
  padding: 22px 64px 22px 70px;
  text-shadow: 0 0 18px rgba(0,240,255,0.95), 0 0 36px rgba(0,240,255,0.55), 0 0 60px rgba(0,240,255,0.3);
  box-shadow: 0 0 36px rgba(0,240,255,0.3), inset 0 0 32px rgba(0,240,255,0.08);
  cursor: pointer;
  position: relative;
  clip-path: polygon(14px 0, 100% 0, calc(100% - 14px) 100%, 0 100%);
  transition: all 0.5s cubic-bezier(0.16,1,0.3,1);
  animation: enterGlow 2.2s ease-in-out infinite;
}
.enter-btn:hover {
  background: rgba(0,240,255,0.12);
  border-color: rgba(0,240,255,1);
  letter-spacing: 0.58em;
  color: #E8FFFF;
  box-shadow: 0 0 60px rgba(0,240,255,0.7), inset 0 0 44px rgba(0,240,255,0.2);
  text-shadow: 0 0 24px rgba(0,240,255,1), 0 0 48px rgba(0,240,255,0.7), 0 0 80px rgba(0,240,255,0.4);
}
@keyframes enterGlow {
  0%,100% { box-shadow: 0 0 36px rgba(0,240,255,0.3), inset 0 0 32px rgba(0,240,255,0.08); }
  50% { box-shadow: 0 0 52px rgba(0,240,255,0.5), inset 0 0 40px rgba(0,240,255,0.14); }
}

/* ---------- System collapse (2.5s, progressive, elegant) ---------- */
.boot-tear, .boot-scanline { opacity: 0; }
.boot-tear {
  position: absolute; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, rgba(0,240,255,0.8), rgba(255,255,255,0.9), rgba(255,0,200,0.7), transparent);
  mix-blend-mode: screen; pointer-events: none;
}
.boot-tear-1 { top: 28%; }
.boot-tear-2 { top: 52%; }
.boot-tear-3 { top: 74%; }
.boot-scanline::after {
  content: ''; position: absolute; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
  mix-blend-mode: screen;
}

.boot-screen[data-collapse="on"] {
  animation: collapseRoot 2.5s cubic-bezier(0.22,0.61,0.36,1) forwards;
}
.boot-screen[data-collapse="on"] .boot-bg {
  animation: collapseBg 2.5s ease-out forwards;
}
.boot-screen[data-collapse="on"] .boot-ui {
  animation: collapseUI 2.5s ease-out forwards;
}
.boot-screen[data-collapse="on"] .boot-segment { animation: collapseSeg 2.5s ease-in forwards; }
.boot-screen[data-collapse="on"] .boot-grain { animation: collapseGrain 2.5s ease-in forwards; }
.boot-screen[data-collapse="on"] .boot-tear { animation: collapseTear 2.5s ease-in forwards; }
.boot-screen[data-collapse="on"] .boot-tear-2 { animation-delay: 0.2s; }
.boot-screen[data-collapse="on"] .boot-tear-3 { animation-delay: 0.4s; }
.boot-screen[data-collapse="on"] .boot-scanline { animation: collapseScan 2.5s linear forwards; }
.boot-screen[data-collapse="on"] .enter-btn {
  animation: collapseBtn 2.5s ease-out forwards;
}

@keyframes collapseRoot {
  0% {
    transform: translate(0,0) rotate(0) scale(1);
    opacity: 1;
  }

  10% {
    transform: translate(-1px,1px) rotate(.05deg) scale(1.005);
  }

  20% {
    transform: translate(2px,-1px) rotate(-.08deg) scale(1.01);
  }

  30% {
    transform: translate(-2px,2px) rotate(.1deg) scale(1.015);
  }

  40% {
    transform: translate(3px,-2px) rotate(-.14deg) scale(1.02);
  }

  50% {
    transform: translate(-3px,2px) rotate(.16deg) scale(1.025);
  }

  60% {
    transform: translate(4px,-3px) rotate(-.2deg) scale(1.03);
  }

  70% {
    transform: translate(-4px,3px) rotate(.22deg) scale(1.035);
    opacity: .92;
  }

  82% {
    transform: translate(5px,-4px) rotate(-.26deg) scale(1.04);
    opacity: .72;
  }

  90% {
    transform: translate(-5px,4px) rotate(.28deg) scale(1.045);
    opacity: .42;
  }

  96% {
    transform: translate(6px,-5px) rotate(-.3deg) scale(1.05);
    opacity: .12;
  }

  100% {
    transform: translate(0,0) rotate(0) scale(1.06);
    opacity: 0;
  }
}

@keyframes collapseBg {
  0%   { filter: brightness(0.55) saturate(1.05); transform: scale(1); }
  40%  { filter: brightness(0.5) saturate(1.2) drop-shadow(2px 0 0 rgba(255,0,200,0.5)) drop-shadow(-2px 0 0 rgba(0,240,255,0.5)); transform: scale(1.02); }
  70%  { filter: brightness(0.45) saturate(1.3) drop-shadow(5px 0 0 rgba(255,0,200,0.7)) drop-shadow(-5px 0 0 rgba(0,240,255,0.7)) blur(1px); transform: scale(1.04); }
  100% { filter: brightness(0.3) saturate(1.4) drop-shadow(10px 0 0 rgba(255,0,200,0.9)) drop-shadow(-10px 0 0 rgba(0,240,255,0.9)) blur(2px); transform: scale(1.08); opacity: 0; }
}

@keyframes collapseUI {
  0% {
    transform: scale(1);
    opacity: 1;
    filter: drop-shadow(0 0 0 transparent);
  }

  35% {
    transform: scale(1.01);
    opacity: 0.98;
    filter:
      drop-shadow(2px 0 0 rgba(255,0,200,0.5))
      drop-shadow(-2px 0 0 rgba(0,240,255,0.5));
  }

  65% {
    transform: scale(1.03) skewX(-1deg);
    opacity: 0.88;
    filter:
      drop-shadow(5px 0 0 rgba(255,0,200,0.7))
      drop-shadow(-5px 0 0 rgba(0,240,255,0.7));
  }

  82% {
    transform: scale(1.045) skewX(1deg);
    opacity: 0.55;
  }

  92% {
    transform: scale(1.055);
    opacity: 0.22;
  }

  97% {
    transform: scale(1.06);
    opacity: 0.08;
  }

  100% {
    transform: scale(1.06);
    opacity: 0;
    filter:
      drop-shadow(12px 0 0 rgba(255,0,200,1))
      drop-shadow(-12px 0 0 rgba(0,240,255,1));
  }
}

@keyframes collapseSeg {
  0%, 55% { opacity: 1; transform: scaleY(1); }
  100% { opacity: 0; transform: scaleY(0.15) translateY(3px); }
}

@keyframes collapseGrain {
  0%, 30% { opacity: 0.5; }
  100% { opacity: 0.95; }
}

@keyframes collapseTear {
  0%, 25% { opacity: 0; transform: translateX(0); }
  40%  { opacity: 0.7; transform: translateX(-12px); }
  60%  { opacity: 0.9; transform: translateX(18px); }
  80%  { opacity: 1; transform: translateX(-24px); }
  100% { opacity: 0; transform: translateX(30px); }
}

@keyframes collapseScan {
  0%   { opacity: 0; }
  10%  { opacity: 0.8; }
  100% { opacity: 0; }
}
.boot-screen[data-collapse="on"] .boot-scanline::after {
  animation: collapseScanMove 2.5s linear forwards;
}
@keyframes collapseScanMove {
  0%   { top: -5%; }
  100% { top: 105%; }
}

@keyframes collapseBtn {
  0% {
    opacity: 1;
    transform: scale(1);
    filter: drop-shadow(0 0 0 transparent);
  }

  40% {
    opacity: 0.95;
    transform: scale(1.01);
  }

  75% {
    opacity: 0.68;
    transform: scale(1.04);
  }

  90% {
    opacity: 0.28;
    transform: scale(1.06);
  }

  97% {
    opacity: 0.08;
    transform: scale(1.07);
  }

  100% {
    opacity: 0;
    transform: scale(1.08);
    filter:
      drop-shadow(12px 0 0 rgba(255,0,200,1))
      drop-shadow(-12px 0 0 rgba(0,240,255,1));
  }
}

/* ═══ Mobile-only (pointer: coarse) performance optimizations ═══
   Desktop collapse animations use filter chains (blur, drop-shadow,
   brightness, saturate) that force full-screen per-frame repaints on
   mobile GPUs. These overrides replace them with compositor-only
   properties (transform, opacity) while preserving identical timing
   and feel. Desktop is completely untouched. */

@media (pointer: coarse) {
  /* ── 1. Collapse: background image ──
     Desktop: filter chain (brightness + saturate + drop-shadow + blur) + scale + opacity
     Mobile:  scale + opacity only — opacity fade handles the darkening */
  .boot-screen[data-collapse="on"] .boot-bg {
    animation: collapseBgMobile 2.5s ease-in forwards;
    will-change: transform, opacity;
  }

  /* ── 2. Collapse: UI container ──
     Desktop: scale + skewX + opacity + drop-shadow filter
     Mobile:  scale + skewX + opacity only */
  .boot-screen[data-collapse="on"] .boot-ui {
    animation: collapseUIMobile 2.5s ease-in forwards;
    will-change: transform, opacity;
  }

  /* ── 3. Collapse: enter button ──
     Desktop: opacity + scale + drop-shadow filter
     Mobile:  opacity + scale only */
.boot-screen[data-collapse="on"] .enter-btn {
  animation: collapseBtn 2.5s ease-out forwards;
}
  /* ── 4. Collapse: scanline ──
     Desktop: animates top (layout-triggering)
     Mobile:  uses transform: translateY (compositor-only) */
  .boot-screen[data-collapse="on"] .boot-scanline::after {
    top: 0;
    animation: collapseScanMoveMobile 2.5s linear forwards;
  }

  /* ── 5. Film grain ──
     Desktop: mix-blend-mode: overlay (per-frame full-screen compositing)
     Mobile:  normal blend, reduced opacity */
  .boot-grain {
    mix-blend-mode: normal;
    opacity: 0.3;
  }
  .boot-screen[data-collapse="on"] .boot-grain {
    animation: collapseGrainMobile 2.5s ease-in forwards;
  }

  /* ── 6. Tear lines + scanline ──
     Desktop: mix-blend-mode: screen
     Mobile:  normal blend (removes per-frame compositing cost) */
  .boot-tear {
    mix-blend-mode: normal;
  }
  .boot-scanline::after {
    mix-blend-mode: normal;
  }

  /* ── 7. Enter button: reduce shadow intensity, kill animated glow ──
     Desktop: 3-layer text-shadow + 2-layer box-shadow + animated enterGlow (box-shadow)
     Mobile:  2-layer reduced shadows, no animation (eliminates per-frame repaint) */
  .enter-btn {
    text-shadow: 0 0 10px rgba(0,240,255,0.7), 0 0 20px rgba(0,240,255,0.3);
    box-shadow: 0 0 20px rgba(0,240,255,0.2), inset 0 0 20px rgba(0,240,255,0.05);
    animation: none;
  }
  .enter-btn:hover {
    text-shadow: 0 0 14px rgba(0,240,255,0.85), 0 0 28px rgba(0,240,255,0.4);
    box-shadow: 0 0 30px rgba(0,240,255,0.35), inset 0 0 24px rgba(0,240,255,0.1);
  }
}

/* ── Mobile-only keyframes (compositor-friendly: transform + opacity only) ── */

@keyframes collapseBgMobile {
  0%   { transform: scale(1); opacity: 1; }
  50%  { transform: scale(1.025); opacity: 0.95; }
  100% { transform: scale(1.08); opacity: 0; }
}

@keyframes collapseUIMobile {
  0%   { transform: scale(1) skewX(0deg); opacity: 1; }
  35%  { transform: scale(1.01) skewX(-1deg); opacity: 0.98; }
  65%  { transform: scale(1.03) skewX(1.5deg); opacity: 0.9; }
  85%  { transform: scale(1.05) skewX(1.5deg); opacity: 0.6; }
  100% { transform: scale(1.08) skewX(0deg); opacity: 0; }
}

@keyframes collapseBtnMobile {
  0%   { opacity: 1; transform: scale(1); }
  75%  { opacity: 0.7; transform: scale(1.04); }
  100% { opacity: 0; transform: scale(1.08); }
}

@keyframes collapseScanMoveMobile {
  0%   { transform: translateY(-5vh); }
  100% { transform: translateY(105vh); }
}

@keyframes collapseGrainMobile {
  0%, 30% { opacity: 0.3; }
  100%    { opacity: 0.6; }
}
`}</style>
    </div>
  );
}
