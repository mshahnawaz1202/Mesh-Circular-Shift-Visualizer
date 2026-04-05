import React, { useRef, useEffect, useMemo } from 'react';
import { indexToRC, buildRowArrows, buildColArrows } from '../utils/shiftLogic';

/**
 * MeshGrid — Renders the p-node grid with animated arrows.
 * Props:
 *   data: number[] - current data values at each node position
 *   p: number
 *   side: number
 *   stage: 'initial' | 'row' | 'col' | 'final'
 *   rowShift: number
 *   colShift: number
 *   highlightArrows: boolean - show movement arrows
 */
function MeshGrid({ data, p, side, stage, rowShift, colShift, highlightArrows }) {
  const canvasRef = useRef(null);

  const rowArrows = useMemo(() => buildRowArrows(p, side, rowShift), [p, side, rowShift]);
  const colArrows = useMemo(() => buildColArrows(p, side, colShift, rowShift), [p, side, colShift, rowShift]);

  const arrows = stage === 'row' ? rowArrows : stage === 'col' ? colArrows : {};

  // Color scheme per stage
  const stageColors = {
    initial: { bg: '#1e1b4b', border: '#6366f1', glow: 'rgba(99,102,241,0.4)', text: '#c7d2fe' },
    row:     { bg: '#1a2e1a', border: '#22c55e', glow: 'rgba(34,197,94,0.4)',  text: '#bbf7d0' },
    col:     { bg: '#1e1a2e', border: '#a855f7', glow: 'rgba(168,85,247,0.4)', text: '#e9d5ff' },
    final:   { bg: '#1e2a1a', border: '#f59e0b', glow: 'rgba(245,158,11,0.4)', text: '#fde68a' },
  };

  const colors = stageColors[stage] || stageColors.initial;

  const CELL = side <= 4 ? 96 : side <= 6 ? 76 : side <= 8 ? 64 : 52;
  const GAP = 18;
  const MARGIN = 40;
  const canvasW = side * (CELL + GAP) - GAP + MARGIN * 2;
  const canvasH = side * (CELL + GAP) - GAP + MARGIN * 2;

  // Compute node centers
  const nodeCenter = (idx) => {
    const [r, c] = indexToRC(idx, side);
    const x = MARGIN + c * (CELL + GAP) + CELL / 2;
    const y = MARGIN + r * (CELL + GAP) + CELL / 2;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.scale(dpr, dpr);

    let reqId;
    let startTime = null;
    const duration = highlightArrows ? 1400 : 0;

    const draw = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const p_raw = duration === 0 ? 1 : Math.min(elapsed / duration, 1.0);
      
      // Ease in-out cubic
      const progress = p_raw < 0.5 ? 4 * p_raw * p_raw * p_raw : 1 - Math.pow(-2 * p_raw + 2, 3) / 2;

      ctx.clearRect(0, 0, canvasW, canvasH);

      // 1. Draw connecting lines
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (let r = 0; r < side; r++) {
        for (let c = 0; c < side; c++) {
          const x = MARGIN + c * (CELL + GAP);
          const y = MARGIN + r * (CELL + GAP);
          if (c < side - 1) {
            ctx.beginPath();
            ctx.moveTo(x + CELL, y + CELL / 2);
            ctx.lineTo(x + CELL + GAP, y + CELL / 2);
            ctx.stroke();
          }
          if (r < side - 1) {
            ctx.beginPath();
            ctx.moveTo(x + CELL / 2, y + CELL);
            ctx.lineTo(x + CELL / 2, y + CELL + GAP);
            ctx.stroke();
          }
        }
      }

      // 2. Draw arrows
      if (highlightArrows) {
        Object.entries(arrows).forEach(([fromStr, to]) => {
          const fc = nodeCenter(Number(fromStr));
          const tc = nodeCenter(to);
          drawArrow(ctx, fc.x, fc.y, tc.x, tc.y, stage === 'row' ? '#22c55e' : '#a855f7');
        });
      }

      // 3. Draw nodes
      for (let i = 0; i < p; i++) {
        const [r, c] = indexToRC(i, side);
        const x = MARGIN + c * (CELL + GAP);
        const y = MARGIN + r * (CELL + GAP);
        const isMoving = highlightArrows && (i in arrows);

        if (isMoving) {
          ctx.shadowBlur = 20;
          ctx.shadowColor = colors.glow;
        } else {
          ctx.shadowBlur = 8;
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
        }

        const grad = ctx.createLinearGradient(x, y, x + CELL, y + CELL);
        grad.addColorStop(0, isMoving ? colors.bg : '#0f0e1a');
        grad.addColorStop(1, isMoving ? colors.bg : '#181727');
        ctx.fillStyle = grad;
        roundRect(ctx, x, y, CELL, CELL, 10);
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = isMoving ? colors.border : 'rgba(255,255,255,0.12)';
        ctx.lineWidth = isMoving ? 2 : 1;
        roundRect(ctx, x, y, CELL, CELL, 10);
        ctx.stroke();

        ctx.font = `500 ${CELL > 70 ? 10 : 8}px 'JetBrains Mono', monospace`;
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.textAlign = 'left';
        ctx.fillText(`N${i}`, x + 6, y + 13);

        // Draw data only if it is NOT migrating, or if animation is finished
        if (!isMoving || progress >= 1.0) {
          ctx.font = `700 ${CELL > 80 ? 22 : CELL > 60 ? 18 : 14}px 'Inter', sans-serif`;
          ctx.fillStyle = isMoving ? colors.text : '#e2e8f0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(data[i]), x + CELL / 2, y + CELL / 2 + 4);
          ctx.textBaseline = 'alphabetic';
        }
      }

      // 4. Draw migrating data packets along the curves!
      if (highlightArrows && progress < 1.0) {
        Object.entries(arrows).forEach(([fromStr, to]) => {
          const fromIdx = Number(fromStr);
          const fc = nodeCenter(fromIdx);
          const tc = nodeCenter(to);
          
          const dx = tc.x - fc.x, dy = tc.y - fc.y;
          const isHoriz = Math.abs(dx) > Math.abs(dy);
          let cx = (fc.x + tc.x) / 2;
          let cy = (fc.y + tc.y) / 2;
          const dist = Math.sqrt(dx*dx + dy*dy);
          
          // Match bezier control point from drawArrow
          if (isHoriz) {
            if (dx > 0) cy -= 30; else cy += 50 + (dist / 8);
          } else {
            if (dy > 0) cx -= 30; else cx += 50 + (dist / 8);
          }

          const getBezier = (t, p0, p1, p2) => (1-t)*(1-t)*p0 + 2*(1-t)*t*p1 + t*t*p2;
          const px = getBezier(progress, fc.x, cx, tc.x);
          const py = getBezier(progress, fc.y, cy, tc.y);

          // Draw the wandering data token
          ctx.shadowBlur = 15;
          ctx.shadowColor = colors.glow;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(px, py, 14, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0;
          ctx.font = `700 12px 'Inter', sans-serif`;
          ctx.fillStyle = '#000000';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(data[fromIdx]), px, py + 1);
          ctx.textBaseline = 'alphabetic';
        });
      }

      if (p_raw < 1.0) {
        reqId = requestAnimationFrame(draw);
      }
    };

    reqId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(reqId);
  }, [data, p, side, stage, arrows, highlightArrows, colors, CELL, GAP, MARGIN, canvasW, canvasH]);

  return (
    <div className="mesh-canvas-wrapper">
      <canvas ref={canvasRef} className="mesh-canvas" aria-label={`Mesh grid, stage: ${stage}`} />
    </div>
  );
}

// Draw an elegant curved arrow from (x1,y1) to (x2,y2)
function drawArrow(ctx, x1, y1, x2, y2, color) {
  const headLen = 14;
  const dx = x2 - x1, dy = y2 - y1;
  const isHoriz = Math.abs(dx) > Math.abs(dy);
  
  let cx = (x1 + x2) / 2;
  let cy = (y1 + y2) / 2;
  const dist = Math.sqrt(dx*dx + dy*dy);
  
  // Bezier curve control point offset
  // By curving them, arrows won't overlap, and wrap-arounds stand out
  if (isHoriz) {
    if (dx > 0) cy -= 30; // shift right: slight arc up
    else cy += 50 + (dist / 8); // wrap around left: deep arc down
  } else {
    if (dy > 0) cx -= 30; // shift down: slight arc left
    else cx += 50 + (dist / 8); // wrap around up: deep arc right
  }

  // Adjust start and end points to sit outside the node bounding box (~30px radius)
  const OFFSET_START = 28;
  const OFFSET_END = 32;

  // Tangents at start and end for proper offset and arrowhead angle
  const tStart_dx = cx - x1, tStart_dy = cy - y1;
  const l1 = Math.sqrt(tStart_dx**2 + tStart_dy**2) || 1;
  const sx = x1 + (tStart_dx / l1) * OFFSET_START;
  const sy = y1 + (tStart_dy / l1) * OFFSET_START;

  const tEnd_dx = x2 - cx, tEnd_dy = y2 - cy;
  const l2 = Math.sqrt(tEnd_dx**2 + tEnd_dy**2) || 1;
  const ex = x2 - (tEnd_dx / l2) * OFFSET_END;
  const ey = y2 - (tEnd_dy / l2) * OFFSET_END;

  // Arrowhead angle follows the end portion of the curve
  const angle = Math.atan2(tEnd_dy, tEnd_dx);

  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 8;
  ctx.shadowColor = color;
  ctx.globalAlpha = 0.9;

  // Draw curve
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(cx, cy, ex, ey);
  ctx.stroke();

  // Draw arrowhead
  ctx.beginPath();
  ctx.moveTo(ex, ey);
  ctx.lineTo(ex - headLen * Math.cos(angle - Math.PI / 6), ey - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(ex - headLen * Math.cos(angle + Math.PI / 6), ey - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Helper to draw a rounded rectangle path
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export default MeshGrid;
