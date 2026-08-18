// /components/Visualizer.tsx
'use client';

import React, { useEffect, useRef } from 'react';

interface VisualizerProps {
  isPlaying: boolean;
  color?: string;
}

export default function Visualizer({ isPlaying, color = '#3b82f6' }: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const barCount = 40;
    const barWidth = 3;
    const gap = 3;
    const heights = Array.from({ length: barCount }, () => Math.random() * 10 + 2);
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, rect.width, rect.height);
      offset += 0.08;

      for (let i = 0; i < barCount; i++) {
        const x = i * (barWidth + gap);
        let targetHeight = 2;

        if (isPlaying) {
          // Calculate an organic wave structure using sine and cosine functions
          const wave1 = Math.sin(i * 0.2 + offset) * 12;
          const wave2 = Math.cos(i * 0.1 - offset * 1.5) * 8;
          const multiplier = Math.sin(offset * 0.5) * 0.5 + 0.8;
          targetHeight = Math.max(3, (15 + wave1 + wave2) * multiplier);
        } else {
          // Standing ambient wave
          targetHeight = Math.max(2, Math.sin(i * 0.15) * 4 + 4);
        }

        // Smooth height transition
        heights[i] = heights[i] * 0.8 + targetHeight * 0.2;

        const y = rect.height - heights[i];

        // Draw visualizer bar
        ctx.fillStyle = color;
        // Subtle glow effect when playing
        if (isPlaying) {
          ctx.shadowBlur = 4;
          ctx.shadowColor = color;
        } else {
          ctx.shadowBlur = 0;
        }

        // Rounded rect for bar
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, heights[i], 1.5);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    // Resize observer to scale properly
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }
    });
    resizeObserver.observe(canvas);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [isPlaying, color]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12 block opacity-80 hover:opacity-100 transition-opacity"
      style={{ minWidth: '120px' }}
    />
  );
}
