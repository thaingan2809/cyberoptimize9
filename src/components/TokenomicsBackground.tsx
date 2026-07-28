import { useEffect, useRef, useState } from 'react';

const BG_IMAGE =
  'https://ik.imagekit.io/zznoau6lx/Cybercoin%20webp/2/wp12396689-lucyna-kushinada-wallpapers.webp';

export default function TokenomicsBackground() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const section = el.closest('section');
    if (!section) return;

    const obs = new IntersectionObserver(
      ([entry]) => setVisible(entry.isIntersecting),
    );
    obs.observe(section);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={rootRef}
      className="tokenomics-bg"
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <img
        src={BG_IMAGE}
        alt=""
        className="tb-image"
        loading="lazy"
        decoding="async"
      />
      <div className="tb-dark" />
      <div className="tb-tint" />
      <style>{`
.tb-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
  user-select: none;
  will-change: transform;
  animation: tbDrift 50s linear infinite alternate;
}
@keyframes tbDrift {
  0%   { transform: scale(1.02) translateY(10px); }
  100% { transform: scale(1.05) translateY(15px); }
}
.tb-dark {
  position: absolute;
  inset: 0;
  background: rgba(5, 5, 7, 0.55);
  pointer-events: none;
}
.tb-tint {
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg,
    rgba(120, 80, 255, 0.10) 0%,
    rgba(0, 240, 255, 0.08) 100%);
  pointer-events: none;
}
@media (prefers-reduced-motion: reduce) {
  .tb-image { animation: none !important; }
}
`}</style>
    </div>
  );
}
