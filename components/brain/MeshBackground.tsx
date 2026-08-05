'use client';

import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export const MESH_TEMPLATES = [
  'Quantum Entanglement',
  'Elastic Spiderweb',
  'Constellation Curves',
  'Living Origami',
  'Magnetic Topography',
  'Cybernetic Circuits',
] as const;

export type MeshTemplate = (typeof MESH_TEMPLATES)[number];

export const DEFAULT_MESH_TEMPLATE: MeshTemplate = 'Quantum Entanglement';

type Point = {
  x: number;
  y: number;
  wanderOffset: number;
  speedMult: number;
};

type MeshBackgroundProps = {
  className?: string;
  meshStyle?: MeshTemplate;
  particleCount?: number;
  connectionDistance?: number;
  meshColor?: string;
  backgroundColor?: string;
  lineWidth?: number;
  nodeSize?: number;
  flowSpeed?: number;
  particleSpeed?: number;
  cursorRadius?: number;
  interactionStrength?: number;
};

export function MeshBackground({
  className,
  meshStyle = DEFAULT_MESH_TEMPLATE,
  particleCount = 140,
  connectionDistance = 130,
  meshColor = '#FACC14',
  backgroundColor = '#222222',
  lineWidth = 1,
  nodeSize = 1.6,
  flowSpeed = 0.85,
  particleSpeed = 0.28,
  cursorRadius = 180,
  interactionStrength = 7,
}: MeshBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationId = 0;
    let points: Point[] = [];
    let width = 0;
    let height = 0;
    let time = 0;

    function init() {
      cancelAnimationFrame(animationId);
      width = container!.offsetWidth;
      height = container!.offsetHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

      points = Array.from({ length: particleCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        wanderOffset: Math.random() * Math.PI * 2,
        speedMult: 0.5 + Math.random(),
      }));

      time = 0;
      animationId = requestAnimationFrame(tick);
    }

    function tick() {
      time += 0.01 * flowSpeed;
      ctx!.globalAlpha = 1;
      ctx!.fillStyle = backgroundColor;
      ctx!.fillRect(0, 0, width, height);

      const mouse = mouseRef.current;
      ctx!.lineCap = 'round';
      ctx!.lineJoin = 'round';

      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        p.x += Math.sin(time * p.speedMult + p.wanderOffset) * particleSpeed;
        p.y += Math.cos(time * p.speedMult + p.wanderOffset) * particleSpeed;

        if (p.x > width + 50) p.x = -50;
        if (p.x < -50) p.x = width + 50;
        if (p.y > height + 50) p.y = -50;
        if (p.y < -50) p.y = height + 50;

        const dxCursor = mouse.x - p.x;
        const dyCursor = mouse.y - p.y;
        const distCursor = Math.sqrt(dxCursor * dxCursor + dyCursor * dyCursor);
        if (distCursor < cursorRadius && distCursor > 0) {
          const force = (cursorRadius - distCursor) / cursorRadius;
          p.x -= (dxCursor / distCursor) * force * interactionStrength;
          p.y -= (dyCursor / distCursor) * force * interactionStrength;
        }
      }

      for (let i = 0; i < points.length; i++) {
        const p1 = points[i];

        for (let j = i + 1; j < points.length; j++) {
          const p2 = points[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= connectionDistance) continue;

          const opacity = 1 - dist / connectionDistance;

          if (meshStyle === 'Elastic Spiderweb') {
            let midX = (p1.x + p2.x) / 2;
            let midY = (p1.y + p2.y) / 2;
            const dxMid = mouse.x - midX;
            const dyMid = mouse.y - midY;
            const distMid = Math.sqrt(dxMid * dxMid + dyMid * dyMid);
            if (distMid < cursorRadius && distMid > 0) {
              const force = (cursorRadius - distMid) / cursorRadius;
              midX -= (dxMid / distMid) * force * 50;
              midY -= (dyMid / distMid) * force * 50;
            }
            ctx!.globalAlpha = opacity * 0.8;
            ctx!.strokeStyle = meshColor;
            ctx!.lineWidth = lineWidth;
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.quadraticCurveTo(midX, midY, p2.x, p2.y);
            ctx!.stroke();
          } else if (meshStyle === 'Constellation Curves') {
            ctx!.globalAlpha = opacity * 0.5;
            ctx!.strokeStyle = meshColor;
            ctx!.lineWidth = lineWidth * 1.5;
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.quadraticCurveTo(
              (p1.x + p2.x) / 2 + Math.sin(p1.wanderOffset) * 30,
              (p1.y + p2.y) / 2 + Math.cos(p1.wanderOffset) * 30,
              p2.x,
              p2.y,
            );
            ctx!.stroke();
          } else if (meshStyle === 'Living Origami') {
            for (let k = j + 1; k < points.length; k++) {
              const p3 = points[k];
              const dist3 = Math.sqrt((p1.x - p3.x) ** 2 + (p1.y - p3.y) ** 2);
              if (dist3 < connectionDistance) {
                ctx!.beginPath();
                ctx!.moveTo(p1.x, p1.y);
                ctx!.lineTo(p2.x, p2.y);
                ctx!.lineTo(p3.x, p3.y);
                ctx!.closePath();
                ctx!.globalAlpha = opacity * 0.15;
                ctx!.fillStyle = meshColor;
                ctx!.fill();
                ctx!.globalAlpha = opacity * 0.3;
                ctx!.strokeStyle = meshColor;
                ctx!.lineWidth = lineWidth * 0.5;
                ctx!.stroke();
                break;
              }
            }
          } else if (meshStyle === 'Magnetic Topography') {
            if (Math.abs(dy) < 40) {
              ctx!.globalAlpha = opacity;
              ctx!.strokeStyle = meshColor;
              ctx!.lineWidth = lineWidth * 1.5;
              ctx!.beginPath();
              ctx!.moveTo(p1.x, p1.y);
              ctx!.quadraticCurveTo((p1.x + p2.x) / 2, (p1.y + p2.y) / 2 + 20, p2.x, p2.y);
              ctx!.stroke();
            }
          } else if (meshStyle === 'Cybernetic Circuits') {
            ctx!.globalAlpha = opacity * 0.5;
            ctx!.strokeStyle = meshColor;
            ctx!.lineWidth = lineWidth * 1.2;
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.lineTo(p2.x, p1.y);
            ctx!.lineTo(p2.x, p2.y);
            ctx!.stroke();
          } else {
            // Quantum Entanglement
            const wave = Math.sin(time * 3 + p1.wanderOffset) * (dist * 0.2);
            ctx!.globalAlpha = opacity * 0.4;
            ctx!.strokeStyle = meshColor;
            ctx!.lineWidth = lineWidth;
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.quadraticCurveTo((p1.x + p2.x) / 2 + wave, (p1.y + p2.y) / 2 - wave, p2.x, p2.y);
            ctx!.stroke();
            ctx!.beginPath();
            ctx!.moveTo(p1.x, p1.y);
            ctx!.quadraticCurveTo((p1.x + p2.x) / 2 - wave, (p1.y + p2.y) / 2 + wave, p2.x, p2.y);
            ctx!.stroke();
          }
        }

        if (meshStyle !== 'Living Origami' && nodeSize > 0) {
          ctx!.globalAlpha = 0.8;
          ctx!.fillStyle = meshColor;
          ctx!.beginPath();
          if (meshStyle === 'Cybernetic Circuits') {
            ctx!.rect(p1.x - nodeSize, p1.y - nodeSize, nodeSize * 2, nodeSize * 2);
          } else {
            ctx!.arc(p1.x, p1.y, nodeSize, 0, Math.PI * 2);
          }
          ctx!.fill();
        }
      }

      animationId = requestAnimationFrame(tick);
    }

    function onPointerMove(event: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      mouseRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top,
      };
    }

    function onPointerLeave() {
      mouseRef.current = { x: -9999, y: -9999 };
    }

    const resizeObserver = new ResizeObserver(() => init());
    resizeObserver.observe(container);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerleave', onPointerLeave);
    init();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerleave', onPointerLeave);
      cancelAnimationFrame(animationId);
    };
  }, [
    meshStyle,
    particleCount,
    connectionDistance,
    meshColor,
    backgroundColor,
    lineWidth,
    nodeSize,
    flowSpeed,
    particleSpeed,
    cursorRadius,
    interactionStrength,
  ]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{ backgroundColor }}
    >
      <canvas ref={canvasRef} className='block h-full w-full' />
    </div>
  );
}
