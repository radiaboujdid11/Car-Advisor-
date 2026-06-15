import { useEffect, useRef } from 'react';

export default function HeroCanvas() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, animId;

    function resize() {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const particles = Array.from({ length: 90 }, () => ({
      x: Math.random(), y: Math.random(), z: Math.random(),
      vx: (Math.random() - .5) * .0004,
      vy: (Math.random() - .5) * .0004,
      vz: (Math.random() - .5) * .0003,
      r: Math.random() * 2 + .5,
    }));

    const nodes = [];
    for (let i = 0; i < 60; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 180 + Math.random() * 60;
      nodes.push({
        x: Math.sin(phi) * Math.cos(theta) * r,
        y: Math.sin(phi) * Math.sin(theta) * r,
        z: Math.cos(phi) * r,
      });
    }

    let t = 0, mouseX = 0, mouseY = 0;
    const onMouse = e => {
      mouseX = (e.clientX / window.innerWidth - .5) * 2;
      mouseY = (e.clientY / window.innerHeight - .5) * 2;
    };
    window.addEventListener('mousemove', onMouse);

    function project(x, y, z, cx, cy) {
      const fov = 500, dz = z + 900;
      return { px: cx + x * fov / dz, py: cy + y * fov / dz, scale: fov / dz };
    }

    function draw() {
      t += .005;
      ctx.clearRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2;
      const ry = t * .4 + mouseX * .5, rx = mouseY * .3;
      const cosy = Math.cos(ry), siny = Math.sin(ry);
      const cosx = Math.cos(rx), sinx = Math.sin(rx);

      const proj = nodes.map(n => {
        let x = n.x * cosy - n.z * siny, z = n.z * cosy + n.x * siny;
        let y = n.y * cosx - z * sinx; z = z * cosx + n.y * sinx;
        return project(x, y, z, cx, cy * .85);
      });

      for (let i = 0; i < proj.length; i++) {
        for (let j = i + 1; j < proj.length; j++) {
          const dx = proj[i].px - proj[j].px, dy = proj[i].py - proj[j].py;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.moveTo(proj[i].px, proj[i].py);
            ctx.lineTo(proj[j].px, proj[j].py);
            ctx.strokeStyle = `rgba(128,0,32,${(1 - d / 90) * .18})`;
            ctx.lineWidth = .6;
            ctx.stroke();
          }
        }
      }

      proj.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.scale * 2.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(128,0,32,${p.scale * 3 * .4})`;
        ctx.fill();
      });

      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.z += p.vz;
        if (p.x < 0 || p.x > 1) p.vx *= -1;
        if (p.y < 0 || p.y > 1) p.vy *= -1;
        if (p.z < 0 || p.z > 1) p.vz *= -1;
        ctx.beginPath();
        ctx.arc(p.x * W, p.y * H, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245,237,216,${(.15 + p.z * .25) * .4})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
