import { useEffect, useRef } from 'react';

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  let mx = 0, my = 0, rx = 0, ry = 0;

  useEffect(() => {
    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const onMove = e => {
      mx = e.clientX; my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    };
    document.addEventListener('mousemove', onMove);

    let animId;
    function lerp() {
      rx += (mx - rx) * .12;
      ry += (my - ry) * .12;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      animId = requestAnimationFrame(lerp);
    }
    lerp();

    const onEnter = () => {
      ring.style.width = '54px';
      ring.style.height = '54px';
      ring.style.opacity = '1';
      ring.style.borderColor = 'var(--gold-2)';
    };
    const onLeave = () => {
      ring.style.width = '36px';
      ring.style.height = '36px';
      ring.style.opacity = '.6';
      ring.style.borderColor = 'var(--gold)';
    };

    document.querySelectorAll('a, button').forEach(el => {
      el.addEventListener('mouseenter', onEnter);
      el.addEventListener('mouseleave', onLeave);
    });

    return () => {
      cancelAnimationFrame(animId);
      document.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <div id="cursor">
      <div id="cursor-dot" ref={dotRef} />
      <div id="cursor-ring" ref={ringRef} />
    </div>
  );
}
