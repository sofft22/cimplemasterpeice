import { useEffect, useRef } from 'react';
import heroImg from '../assets/hero.jpg';

const CONFIG = {
  categories: ['Wigs', 'Extensions', 'Hair Care', 'Ponytails', 'Clip-ins', 'Bundles'],
  breathe: true,
  hairZones: [] as { u0: number; u1: number; v0: number; v1: number; feather?: number; tip?: number }[],
  glints: [] as [number, number, number][],
};

export function HeroAnimated() {
  const heroRef = useRef<HTMLDivElement>(null);
  const photoRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const glitterRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const par = photoRef.current;
    const img = imgRef.current;
    const pc = drawCanvasRef.current;
    const c = glitterRef.current;
    if (!hero || !par || !img || !pc || !c) return;

    const pg = pc.getContext('2d')!;
    const g = c.getContext('2d')!;
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t0 = performance.now();
    let last = t0;
    const PI = Math.PI;

    const cl = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
    const sm = (a: number, b: number, v: number) => {
      v = cl((v - a) / (b - a), 0, 1);
      return v * v * (3 - 2 * v);
    };
    const rnd = (n: number) => {
      const x = Math.sin(n * 127.1) * 43758.5453;
      return x - Math.floor(x);
    };

    const weight = (u: number, v: number) => {
      let m = 0;
      for (const z of CONFIG.hairZones) {
        const f = z.feather || 0.08;
        const tp = z.tip || 0;
        let w =
          sm(z.u0, z.u0 + f, u) *
          (1 - sm(z.u1 - f, z.u1, u)) *
          sm(z.v0, z.v0 + f, v) *
          (1 - sm(z.v1 - f, z.v1, v));
        w *= 1 - tp + tp * sm(z.v0, z.v1, v);
        m = Math.max(m, w);
      }
      return m;
    };

    let W = 0, H = 0, PW = 0, PH = 0, D = 1, iw = 0, ih = 0, s = 1, ox = 0, oy = 0;
    let cells: number[][] = [];
    const C = 10;
    let gp = 0, gv = 0, ready = false;
    let B: {
      x: number; y: number; vx: number; vy: number; age: number;
      max: number; s: number; gold: boolean;
    }[] = [];
    let lx: number | null = null;
    const G: number[] = [];
    let gi = 0;
    let lastAct = t0;
    let hint = -1;
    let first = true;

    for (let z = 0; z < 64; z++) G.push(0);

    const fit = () => {
      D = Math.min(window.devicePixelRatio || 1, 2);
      W = c.offsetWidth || window.innerWidth;
      H = c.offsetHeight || window.innerHeight;
      c.width = W * D; c.height = H * D;
      g.setTransform(D, 0, 0, D, 0, 0);
      PW = pc.offsetWidth; PH = pc.offsetHeight;
      pc.width = PW * D; pc.height = PH * D;
      pg.setTransform(D, 0, 0, D, 0, 0);
      iw = img.naturalWidth; ih = img.naturalHeight;
      if (!iw) return;
      s = Math.max(PW / iw, PH / ih);
      ox = (PW - iw * s) * 0.5;
      oy = (PH - ih * s) * (PW >= 900 ? 0.12 : 0);
      cells = [];
      for (let y = 0; y < PH; y += C)
        for (let x = 0; x < PW; x += C) {
          const u = (x + C / 2 - ox) / (iw * s);
          const v = (y + C / 2 - oy) / (ih * s);
          if (u < 0 || u > 1 || v < 0 || v > 1) continue;
          const w = weight(u, v);
          const bt = CONFIG.breathe ? sm(0.5, 0.85, v) : 0;
          if (w > 0.02 || bt > 0.02) cells.push([x, y, u, v, w, bt]);
        }
    };

    const warp = (t: number) => {
      const br = (0.5 + 0.5 * Math.sin(t * 0.9)) * 4;
      pg.clearRect(0, 0, PW, PH);
      pg.drawImage(img, ox, oy, iw * s, ih * s);
      for (let i = 0; i < cells.length; i++) {
        const q = cells[i];
        const w = q[4];
        const dx =
          (4.2 * (Math.sin(t + q[3] * 8 + q[2] * 3) + 0.5 * Math.sin(t * 1.7 + q[3] * 15)) +
            G[(gi - Math.round(q[3] * 18) + 64) & 63] * 4.5) *
          w;
        const dy = Math.sin(t * 1.5 + q[2] * 9) * 1.2 * w - br * q[5];
        pg.drawImage(
          img,
          (q[0] - ox) / s - dx,
          (q[1] - oy) / s - dy,
          (C + 0.7) / s,
          (C + 0.7) / s,
          q[0],
          q[1],
          C + 0.7,
          C + 0.7
        );
      }

      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        const grad = pg.createLinearGradient(0, 0, 0, PH * 0.15);
        grad.addColorStop(0, 'rgba(229, 162, 181, 1)');
        grad.addColorStop(1, 'rgba(229, 162, 181, 0)');
        pg.fillStyle = grad;
        pg.fillRect(0, 0, PW, PH * 0.15);
      } else {
        const grad = pg.createLinearGradient(0, 0, PW * 0.3, 0);
        grad.addColorStop(0, 'rgba(229, 162, 181, 1)');
        grad.addColorStop(1, 'rgba(229, 162, 181, 0)');
        pg.fillStyle = grad;
        pg.fillRect(0, 0, PW * 0.3, PH);
      }
    };

    const star = (x: number, y: number, z: number) => {
      g.beginPath();
      g.moveTo(x, y - z);
      g.quadraticCurveTo(x, y, x + z, y);
      g.quadraticCurveTo(x, y, x, y + z);
      g.quadraticCurveTo(x, y, x - z, y);
      g.quadraticCurveTo(x, y, x, y - z);
      g.fill();
    };

    const spark = (x: number, y: number, big: boolean) => {
      B.push({
        x, y,
        vx: (Math.random() - 0.5) * (big ? 260 : 24),
        vy: (Math.random() - 0.5) * (big ? 260 : 24) - (big ? 30 : 8),
        age: 0,
        max: big ? 0.9 + Math.random() * 0.7 : 0.5 + Math.random() * 0.4,
        s: big ? 2.5 + Math.random() * 4 : 1.5 + Math.random() * 2.5,
        gold: Math.random() < 0.6,
      });
    };

    const P: {
      x: number; y: number; s: number; sp: number; ph: number; big: boolean; gold: boolean;
    }[] = [];
    for (let i = 0; i < 120; i++) {
      P.push({
        x: rnd(i),
        y: rnd(i + 300),
        s: 0.7 + rnd(i + 600) * 1.6,
        sp: 0,
        ph: rnd(i + 1200) * 6.28,
        big: i % 7 === 0,
        gold: i % 2 === 0,
      });
    }

    let rafId = 0;
    let started = false;

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const el = (now - t0) / 1000;
      const amp = rm ? 1 : sm(0.2, 2.8, el);
      const t = rm ? 1.3 : el * 0.7;
      gv += -0.08 * gp - 0.07 * gv;
      gp += gv;
      gi = (gi + 1) & 63;
      G[gi] = gp;

      if (ready) warp(el);

      g.clearRect(0, 0, W, H);
      const cnt = Math.min(P.length, Math.round((W * H) / 5500));
      for (let j = 0; j < cnt; j++) {
        const p = P[j];
        const x = p.x * W;
        const y = p.y * H;
        const tw = Math.pow(Math.max(0, Math.sin(t * 1.2 + p.ph)), 5);
        const al = (0.18 + 0.82 * tw) * amp;
        g.shadowBlur = 0;
        g.fillStyle = (p.gold ? 'rgba(255,214,140,' : 'rgba(255,255,255,') + al + ')';
        if (p.big) {
          g.shadowColor = 'rgba(255,205,130,.95)';
          g.shadowBlur = 10;
          star(x, y, (5 + p.s * 4) * (0.35 + tw) * amp);
        } else {
          g.beginPath();
          g.arc(x, y, p.s * (0.55 + 0.7 * tw), 0, PI * 2);
          g.fill();
        }
      }
      if (iw && CONFIG.glints.length) {
        const pr = pc.getBoundingClientRect();
        const cr = c.getBoundingClientRect();
        const kx = pr.width / (PW || 1);
        const ky = pr.height / (PH || 1);
        CONFIG.glints.forEach((q) => {
          const w = Math.pow(Math.max(0, Math.sin(el * 1.1 + q[2])), 14);
          if (w < 0.02) return;
          const x = pr.left - cr.left + (ox + q[0] * iw * s) * kx;
          const y = pr.top - cr.top + (oy + q[1] * ih * s) * ky;
          g.fillStyle = 'rgba(255,255,255,' + w + ')';
          g.shadowColor = 'rgba(255,205,130,.95)';
          g.shadowBlur = 12;
          star(x, y, (4 + 9 * w) * amp);
        });
      }

      if (!rm) {
        if (hint < 0 && now - lastAct > (first ? 1600 : 2800)) {
          hint = 0;
          first = false;
        }
        if (hint >= 0) {
          hint += dt;
          const hp = hint / 0.95;
          if (hp >= 1) {
            hint = -1;
            lastAct = now;
          } else {
            for (let s = 0; s < 10; s++) {
              spark(W * (0.15 + 0.7 * hp), H * (0.56 - 0.1 * hp + 0.04 * Math.sin(hp * 6)), false);
            }
            gv += 0.03;
          }
        }
      }
      for (let k = B.length - 1; k >= 0; k--) {
        const b = B[k];
        b.age += dt;
        if (b.age > b.max) {
          B.splice(k, 1);
          continue;
        }
        const a = 1 - b.age / b.max;
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        b.vy += 70 * dt;
        b.vx *= 0.985;
        g.fillStyle = (b.gold ? 'rgba(255,214,140,' : 'rgba(255,255,255,') + a + ')';
        g.shadowColor = 'rgba(255,205,130,.9)';
        g.shadowBlur = 8;
        star(b.x, b.y, b.s * (0.5 + a) * 1.6);
      }
      g.shadowBlur = 0;
      if (!rm) rafId = requestAnimationFrame(frame);
    };

    const start = () => {
      fit();
      par.classList.add('on');
      ready = true;
      if (!started) {
        started = true;
        rafId = requestAnimationFrame(frame);
      }
    };

    start();

    if (!img.complete || !img.naturalWidth) {
      img.addEventListener('load', () => {
        fit();
        ready = true;
        par.classList.add('on');
      });
    }

    img.addEventListener('error', () => {
      setTimeout(() => {
        const src = img.src;
        img.src = '';
        img.src = src;
      }, 800);
    });

    const onResize = () => {
      fit();
      if (rm) frame(performance.now());
    };
    window.addEventListener('resize', onResize);

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest?.('.cta')) return;
      const q = c.getBoundingClientRect();
      const x = e.clientX - q.left;
      const y = e.clientY - q.top;
      lx = e.clientX;
      lastAct = performance.now();
      for (let i = 0; i < 14; i++) spark(x, y, true);
      gv += (x < W / 2 ? 1 : -1) * 0.8;
    };
    hero.addEventListener('pointerdown', onPointerDown);

    const onPointerMove = (e: PointerEvent) => {
      lastAct = performance.now();
      if (lx !== null) {
        gv += cl(e.clientX - lx, -40, 40) * 0.009;
        if (e.pointerType === 'touch' || e.buttons) {
          const r2 = c.getBoundingClientRect();
          spark(e.clientX - r2.left, e.clientY - r2.top, false);
          spark(e.clientX - r2.left, e.clientY - r2.top, false);
        }
      }
      lx = e.clientX;
      if (e.pointerType === 'touch') return;
      par.style.setProperty('--px', (e.clientX / window.innerWidth - 0.5).toFixed(3));
      par.style.setProperty('--py', (e.clientY / window.innerHeight - 0.5).toFixed(3));
    };
    window.addEventListener('pointermove', onPointerMove);

    const onPointerUp = () => { lx = null; };
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      par.style.setProperty('--px', cl(e.gamma / 40, -0.5, 0.5).toFixed(3));
      par.style.setProperty('--py', cl(((e.beta || 50) - 50) / 70, -0.5, 0.5).toFixed(3));
    };
    window.addEventListener('deviceorientation', onOrient);

    /* CLEANUP — closes the useEffect */
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      hero.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('deviceorientation', onOrient);
    };
  }, []);

  /* JSX — OUTSIDE the useEffect */
    return (
    <div ref={heroRef} className="cimmple-hero">
      <div className="copy">
        <h1>
          Hair,
          <br />
          simplified.
        </h1>
      </div>

      <div ref={photoRef} className="photo-wrap">
        <img ref={imgRef} src={heroImg} alt="" />
        <canvas ref={drawCanvasRef} />
        <div className="photo-fade" />
      </div>

      <a href="#best-sellers" className="cta">
        Shop now
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          className="cta-arrow"
        >
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
      </a>

      <canvas ref={glitterRef} className="glitter" />
    </div>
  );
}