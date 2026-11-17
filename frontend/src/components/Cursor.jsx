import { useEffect, useRef } from 'react';

const INTERACTIVE = 'a, button';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return undefined;

    let mouseX = 0;
    let mouseY = 0;
    let ringX = 0;
    let ringY = 0;
    let animId;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX}px`;
      dot.style.top = `${mouseY}px`;
    };

    // L'anneau suit la souris avec un léger retard (interpolation linéaire).
    const follow = () => {
      ringX += (mouseX - ringX) * 0.12;
      ringY += (mouseY - ringY) * 0.12;
      ring.style.left = `${ringX}px`;
      ring.style.top = `${ringY}px`;
      animId = requestAnimationFrame(follow);
    };
    follow();

    const expand = () => {
      ring.style.width = '54px';
      ring.style.height = '54px';
      ring.style.opacity = '1';
      ring.style.borderColor = 'var(--gold-2)';
    };
    const shrink = () => {
      ring.style.width = '36px';
      ring.style.height = '36px';
      ring.style.opacity = '.6';
      ring.style.borderColor = 'var(--gold)';
    };

    // Délégation d'événements : fonctionne aussi pour les liens/boutons ajoutés après le montage.
    const onOver = (e) => {
      const target = e.target.closest?.(INTERACTIVE);
      if (target && !target.contains(e.relatedTarget)) expand();
    };
    const onOut = (e) => {
      const target = e.target.closest?.(INTERACTIVE);
      if (target && !target.contains(e.relatedTarget)) shrink();
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseover', onOver);
    document.addEventListener('mouseout', onOut);

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <div id="cursor">
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />
    </div>
  );
}
