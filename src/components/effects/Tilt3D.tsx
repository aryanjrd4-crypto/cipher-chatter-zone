import { useRef, ReactNode } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface Tilt3DProps {
  children: ReactNode;
  className?: string;
  /** Max rotation in degrees (default 6) */
  intensity?: number;
  /** Lift on hover in px (default 6) */
  lift?: number;
  /** Disable on touch devices */
  disableOnMobile?: boolean;
}

/**
 * Apple-style 3D parallax tilt wrapper.
 * Subtly rotates a card based on cursor position with a smooth lift.
 * Pure CSS transforms via Framer Motion springs — buttery 60fps.
 */
export function Tilt3D({
  children,
  className = '',
  intensity = 6,
  lift = 6,
  disableOnMobile = true,
}: Tilt3DProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const z = useMotionValue(0);

  const springCfg = { stiffness: 200, damping: 22, mass: 0.6 };
  const sx = useSpring(x, springCfg);
  const sy = useSpring(y, springCfg);
  const sz = useSpring(z, springCfg);

  const rotateX = useTransform(sy, (v) => -v * intensity);
  const rotateY = useTransform(sx, (v) => v * intensity);
  const translateZ = useTransform(sz, (v) => v * lift);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disableOnMobile && window.matchMedia('(hover: none)').matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(px);
    y.set(py);
    z.set(1);
  };

  const handleLeave = () => {
    x.set(0);
    y.set(0);
    z.set(0);
  };

  return (
    <div
      ref={ref}
      className={`perspective-1000 ${className}`}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          translateZ,
          transformStyle: 'preserve-3d',
        }}
        className="will-change-transform"
      >
        {children}
      </motion.div>
    </div>
  );
}
