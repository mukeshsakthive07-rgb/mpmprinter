import React, { useEffect, useRef } from 'react';

export const StarryGlowBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = window.innerWidth;
    let h = window.innerHeight;

    const setupCanvas = () => {
      if (!canvas) return;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
    };

    setupCanvas();

    const FOV = 450;
    let rawMouseX = -1000;
    let rawMouseY = -1000;

    const onMouseMove = (e: MouseEvent) => {
      if (isMobile) return;
      rawMouseX = e.clientX;
      rawMouseY = e.clientY;
    };

    window.addEventListener('mousemove', onMouseMove);
    const onResize = () => setupCanvas();
    window.addEventListener('resize', onResize);

    // 1. 3D Stars
    const STAR_COUNT = isMobile ? 25 : 50;
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: (Math.random() - 0.5) * w * 2.2,
      y: (Math.random() - 0.5) * h * 2.2,
      z: Math.random() * 1000 + 50,
      r: Math.random() * 1.6 + 0.8,
    }));

    // 2. 3D Meteors
    const METEOR_COUNT = isMobile ? 5 : 10;
    function createMeteor(randomZ = true) {
      return {
        x: (Math.random() - 0.5) * w * 2,
        y: -h * 0.5 - Math.random() * 200,
        z: randomZ ? Math.random() * 900 + 100 : 900,
        vy: Math.random() * 12 + 8,
        vz: -(Math.random() * 7 + 5),
        tail: Math.random() * 60 + 35,
        size: Math.random() * 2 + 1,
        color: Math.random() > 0.4 ? '#00f0ff' : '#00e676',
      };
    }
    const meteors = Array.from({ length: METEOR_COUNT }, () => createMeteor());

    // 3. 3D Floating Glossy Spheres
    const spheres = [
      { x: -w * 0.35, y: -h * 0.2, z: 350, baseRadius: 60, color: '#00f0ff', phase: 0, vx: 0, vy: 0, offsetX: 0, offsetY: 0 },
      { x: w * 0.38, y: -h * 0.05, z: 280, baseRadius: 75, color: '#a855f7', phase: 2, vx: 0, vy: 0, offsetX: 0, offsetY: 0 },
      { x: -w * 0.32, y: h * 0.28, z: 240, baseRadius: 65, color: '#00e676', phase: 4, vx: 0, vy: 0, offsetX: 0, offsetY: 0 },
      { x: w * 0.3, y: h * 0.32, z: 420, baseRadius: 50, color: '#3b82f6', phase: 1, vx: 0, vy: 0, offsetX: 0, offsetY: 0 },
    ];

    let time = 0;
    const draw = () => {
      animId = requestAnimationFrame(draw);
      if (document.hidden) return;
      time += 0.02;
      ctx.clearRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      // Draw Stars
      stars.forEach((s) => {
        s.z -= 0.5;
        if (s.z <= 10) s.z = 1000;
        const scale = FOV / (FOV + s.z);
        const sx = cx + s.x * scale;
        const sy = cy + s.y * scale;
        if (sx > 0 && sx < w && sy > 0 && sy < h) {
          ctx.beginPath();
          ctx.arc(sx, sy, Math.max(0.6, s.r * scale * 1.4), 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(0.9, scale * 1.5)})`;
          ctx.fill();
        }
      });

      // Draw Meteors
      meteors.forEach((m, idx) => {
        m.y += m.vy;
        m.z += m.vz;
        if (m.z <= 20 || m.y > h * 1.2) {
          meteors[idx] = createMeteor(false);
        }
        const scaleHead = FOV / (FOV + m.z);
        const hx = cx + m.x * scaleHead;
        const hy = cy + m.y * scaleHead;
        const tailZ = m.z + m.tail;
        const scaleTail = FOV / (FOV + tailZ);
        const tx = cx + m.x * scaleTail;
        const ty = cy + (m.y - m.tail * 2) * scaleTail;

        if (hx > -50 && hx < w + 50 && hy > -50 && hy < h + 100) {
          const grad = ctx.createLinearGradient(hx, hy, tx, ty);
          grad.addColorStop(0, '#ffffff');
          grad.addColorStop(0.35, m.color);
          grad.addColorStop(1, 'transparent');
          ctx.beginPath();
          ctx.moveTo(hx, hy);
          ctx.lineTo(tx, ty);
          ctx.strokeStyle = grad;
          ctx.lineWidth = m.size * scaleHead * 2.5;
          ctx.lineCap = 'round';
          ctx.stroke();
        }
      });

      // Draw Floating Spheres
      spheres.forEach((sp) => {
        const floatY = sp.y + Math.sin(time + sp.phase) * 22;
        const floatX = sp.x + Math.cos(time * 0.7 + sp.phase) * 14;
        const scale = FOV / (FOV + sp.z);

        if (!isMobile) {
          const sxTemp = cx + (floatX + sp.offsetX) * scale;
          const syTemp = cy + (floatY + sp.offsetY) * scale;
          const dx = sxTemp - rawMouseX;
          const dy = syTemp - rawMouseY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 200 && dist > 0) {
            const force = (200 - dist) / 200;
            sp.vx += (dx / dist) * force * 3.5;
            sp.vy += (dy / dist) * force * 3.5;
          }
        }

        sp.vx -= sp.offsetX * 0.04;
        sp.vy -= sp.offsetY * 0.04;
        sp.vx *= 0.88;
        sp.vy *= 0.88;
        sp.offsetX += sp.vx;
        sp.offsetY += sp.vy;

        const sx = cx + (floatX + sp.offsetX) * scale;
        const sy = cy + (floatY + sp.offsetY) * scale;
        const radius = sp.baseRadius * scale;

        const sphereGrad = ctx.createRadialGradient(
          sx - radius * 0.35,
          sy - radius * 0.35,
          radius * 0.05,
          sx,
          sy,
          radius
        );
        sphereGrad.addColorStop(0, '#ffffff');
        sphereGrad.addColorStop(0.3, sp.color);
        sphereGrad.addColorStop(0.85, 'rgba(10, 25, 50, 0.85)');
        sphereGrad.addColorStop(1, 'rgba(5, 10, 25, 0.3)');

        ctx.beginPath();
        ctx.arc(sx, sy, radius, 0, Math.PI * 2);
        ctx.fillStyle = sphereGrad;
        ctx.fill();
      });
    };

    draw();

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none bg-[#050814] overflow-hidden" style={{ zIndex: 0, contain: 'strict' }}>
      {/* Volumetric Auroras */}
      <div 
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full bg-cyan-500/20 blur-[140px] animate-pulse" 
        style={{ animationDuration: '6s' }} 
      />
      <div 
        className="absolute top-1/3 -right-32 w-[650px] h-[650px] rounded-full bg-purple-600/20 blur-[150px] animate-pulse" 
        style={{ animationDuration: '8s' }} 
      />
      <div 
        className="absolute -bottom-32 left-1/3 w-[650px] h-[650px] rounded-full bg-emerald-500/15 blur-[140px] animate-pulse" 
        style={{ animationDuration: '7s' }} 
      />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ willChange: 'transform' }} />
    </div>
  );
};

export default StarryGlowBackground;
