"use client";

import { useEffect, useRef } from "react";
import { hexToRgba } from "./settings";

//  World-to-screen — exact same math as the in-game DLL
function w2s(px, py, pz, m, w, h) {
  const sx = m[0] * px + m[1] * py + m[2] * pz + m[3];
  const sy = m[4] * px + m[5] * py + m[6] * pz + m[7];
  const sw = m[12] * px + m[13] * py + m[14] * pz + m[15];
  if (sw < 0.001) return null;
  const inv = 1 / sw;
  return { x: (w * 0.5) * (sx * inv + 1), y: (h * 0.5) * (1 - sy * inv) };
}

function dist3(a, b) {
  const dx = a[0] - b[0], dy = a[1] - b[1], dz = a[2] - b[2];
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function cornerBox(ctx, x, y, w, h, color, t, cl) {
  const l = Math.min(cl, Math.min(w, h) * 0.28);
  ctx.strokeStyle = color;
  ctx.lineWidth = t;
  ctx.lineCap = "butt";
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + l, y);
  ctx.moveTo(x, y); ctx.lineTo(x, y + l);
  ctx.moveTo(x + w, y); ctx.lineTo(x + w - l, y);
  ctx.moveTo(x + w, y); ctx.lineTo(x + w, y + l);
  ctx.moveTo(x, y + h); ctx.lineTo(x + l, y + h);
  ctx.moveTo(x, y + h); ctx.lineTo(x, y + h - l);
  ctx.moveTo(x + w, y + h); ctx.lineTo(x + w - l, y + h);
  ctx.moveTo(x + w, y + h); ctx.lineTo(x + w, y + h - l);
  ctx.stroke();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBox(ctx, x, y, w, h, col, t, bgA, style) {
  const outline = "rgba(0,0,0,0.57)";
  switch (style) {
    case 0:
      ctx.strokeStyle = outline;
      ctx.lineWidth = t + 2;
      ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = t;
      ctx.strokeRect(x, y, w, h);
      break;
    case 1:
      cornerBox(ctx, x - 1, y - 1, w + 2, h + 2, outline, t + 1, 15);
      cornerBox(ctx, x, y, w, h, col, t, 13);
      break;
    case 2:
      ctx.strokeStyle = outline;
      ctx.lineWidth = t + 2;
      roundedRect(ctx, x - 1, y - 1, w + 2, h + 2, 5);
      ctx.stroke();
      ctx.strokeStyle = col;
      ctx.lineWidth = t;
      roundedRect(ctx, x, y, w, h, 4);
      ctx.stroke();
      break;
    case 3:
      if (bgA) {
        ctx.fillStyle = bgA;
        ctx.fillRect(x, y, w, h);
      }
      cornerBox(ctx, x - 1, y - 1, w + 2, h + 2, outline, t + 1, 15);
      cornerBox(ctx, x, y, w, h, col, t, 13);
      break;
  }
}

function drawHealthBar(ctx, x, y, h, bH) {  const bw = 3;
  const bx = x - bw - 5;
  ctx.fillStyle = "rgba(0,0,0,0.49)";
  roundedRect(ctx, bx - 1, y - 1, bw + 2, bH + 2, 2);
  ctx.fill();
  const grad = ctx.createLinearGradient(0, y, 0, y + bH);
  grad.addColorStop(0, "rgb(78,245,78)");
  grad.addColorStop(1, "rgb(0,192,0)");
  ctx.fillStyle = grad;
  roundedRect(ctx, bx, y, bw, bH, 1);
  ctx.fill();
}

function drawSnapLine(ctx, frame, s, hx, hy) {
  const ly = s.snapLinePos === 0 ? 0 : s.snapLinePos === 1 ? frame.h * 0.5 : frame.h;
  ctx.strokeStyle = "rgba(0,0,0,0.29)";
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(frame.w * 0.5 + 1, ly + 1);
  ctx.lineTo(hx + 1, hy + 1);
  ctx.stroke();
  ctx.strokeStyle = hexToRgba(s.lineColor, 0.8);
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(frame.w * 0.5, ly);
  ctx.lineTo(hx, hy);
  ctx.stroke();
}

function drawEdgeIndicator(ctx, e, m, frame, s, dist) {
  // world -> screen-space direction from the view center (works even behind camera)
  const sx = m[0] * e.x + m[1] * e.y + m[2] * e.z + m[3];
  const sy = m[4] * e.x + m[5] * e.y + m[6] * e.z + m[7];
  const sw = m[12] * e.x + m[13] * e.y + m[14] * e.z + m[15];
  let nx, ny;
  if (sw > 0.001) {
    nx = (sx / sw) * frame.w * 0.5;
    ny = -(sy / sw) * frame.h * 0.5;
  } else {
    // behind camera: mirror through the view center so the arrow points the right way
    nx = -(sx / sw) * frame.w * 0.5;
    ny = (sy / sw) * frame.h * 0.5;
  }
  const len = Math.hypot(nx, ny);
  if (len < 1e-6) return;
  const ux = nx / len;
  const uy = ny / len;

  // intersection of the direction ray with the screen rect (with margin)
  const margin = 30;
  const cx = frame.w * 0.5;
  const cy = frame.h * 0.5;
  let t = Infinity;
  if (ux > 0) t = Math.min(t, (frame.w - margin - cx) / ux);
  else if (ux < 0) t = Math.min(t, (margin - cx) / ux);
  if (uy > 0) t = Math.min(t, (frame.h - margin - cy) / uy);
  else if (uy < 0) t = Math.min(t, (margin - cy) / uy);
  const px = cx + ux * t;
  const py = cy + uy * t;

  // red glowing dot at the screen edge with a glowing arrow pointing toward the enemy
  ctx.save();
  ctx.shadowColor = "rgb(255,64,64)";
  ctx.shadowBlur = 10;
  ctx.fillStyle = "rgb(255,64,64)";
  ctx.beginPath();
  ctx.arc(px, py, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.save();
  ctx.translate(px, py);
  ctx.rotate(Math.atan2(uy, ux));
  ctx.shadowColor = "rgb(255,64,64)";
  ctx.shadowBlur = 8;
  ctx.fillStyle = "rgb(255,64,64)";
  ctx.beginPath();
  ctx.moveTo(15, 0);
  ctx.lineTo(-5, -6);
  ctx.lineTo(-5, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // const txt = `${Math.round(dist)}m`;
  // const tw = ctx.measureText(txt).width;
  // const tx = Math.max(12, Math.min(frame.w - tw - 12, px + 14));
  // drawTextShadow(ctx, txt, tx, py + 4, hexToRgba(s.textColor, 0.95));
}

function drawTextShadow(ctx, text, x, y, color, font = "13px 'Segoe UI', sans-serif") {
  ctx.font = font;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

function drawCrosshair(ctx, frame, s) {
  const cx = frame.w * 0.5;
  const cy = frame.h * 0.5;
  const c = s.crosshairColor;
  ctx.strokeStyle = "rgba(0,0,0,0.41)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy + 1); ctx.lineTo(cx - 4, cy + 1);
  ctx.moveTo(cx + 5, cy + 1); ctx.lineTo(cx + 12, cy + 1);
  ctx.moveTo(cx + 1, cy - 11); ctx.lineTo(cx + 1, cy - 4);
  ctx.moveTo(cx + 1, cy + 5); ctx.lineTo(cx + 1, cy + 12);
  ctx.stroke();
  ctx.strokeStyle = c;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - 11, cy); ctx.lineTo(cx - 4, cy);
  ctx.moveTo(cx + 4, cy); ctx.lineTo(cx + 11, cy);
  ctx.moveTo(cx, cy - 11); ctx.lineTo(cx, cy - 4);
  ctx.moveTo(cx, cy + 4); ctx.lineTo(cx, cy + 11);
  ctx.stroke();
  ctx.fillStyle = "rgba(0,0,0,0.41)";
  ctx.beginPath(); ctx.arc(cx, cy + 1, 2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = c;
  ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
}

//  local player = the biggest on-screen box in the bottom-center region
//  (where your own character stays in third person), fallback to the global
//  biggest box - prevents an enemy next to you from stealing the tag
function findLocalIdx(frame, s, m) {
  if (!s.localDetect || !frame.p || frame.p.length === 0) return -1;
  const w = frame.w;
  const h = frame.h;
  let bestBH = 0;
  let bestIdx = -1;
  let regionBH = 0;
  let regionIdx = -1;
  for (const e of frame.p) {
    const head = w2s(e.x, e.y + s.headOffset, e.z, m, w, h);
    const feet = w2s(e.x, e.y - s.feetOffset, e.z, m, w, h);
    let bH = feet && head ? feet.y - head.y : 0;
    if (!head || !feet || bH <= 2) {
      const p = w2s(e.x, e.y, e.z, m, w, h);
      head = p;
      feet = p;
      bH = p ? 50 : 0;
    }
    if (bH > bestBH) { bestBH = bH; bestIdx = e.i; }
    if (bH > 0 && head) {
      const hx = head.x;
      const hy = head.y;
      if (hx > w * 0.2 && hx < w * 0.8 && hy > h * 0.35 && hy < h * 1.2) {
        if (bH > regionBH) { regionBH = bH; regionIdx = e.i; }
      }
    }
  }
  return regionIdx !== -1 ? regionIdx : bestIdx;
}

function renderFrame(ctx, frame, s) {
  ctx.clearRect(0, 0, frame.w, frame.h);

  const m = frame.m;
  const localIdx = findLocalIdx(frame, s, m);
  if (s.crosshair) drawCrosshair(ctx, frame, s);  if (s.espEnabled && frame.p && frame.p.length > 0) {
    for (const e of frame.p) {
    // the local player's own box is never drawn (biggest box / smallest label)
    if (e.i === localIdx) continue;
    // distance is always measured from the camera (screen POV), never from the
    // detected "local player" entity - a wrong detection would poison every label
    const dist = dist3([e.x, e.y, e.z], frame.c || [0, 0, 0]);
    if (s.maxDist > 0 && dist > s.maxDist) continue;

    let head = w2s(e.x, e.y + s.headOffset, e.z, m, frame.w, frame.h);
    let feet = w2s(e.x, e.y - s.feetOffset, e.z, m, frame.w, frame.h);
    let bH = feet && head ? feet.y - head.y : 0;
    if (!head || !feet || bH <= 2) {
      const p = w2s(e.x, e.y, e.z, m, frame.w, frame.h);
      head = p;
      feet = p;
      bH = p ? 50 : 0;
    }

    // behind camera -> never draw anything (mirrored indicators land on the
    // local player's character in third person and look like self-ESP)
    if (!head) continue;

    // fully off-screen (but in front of camera) -> edge indicator instead of ESP
    const pad = 28;
    const offScreen =
      head.x < -pad ||
      head.x > frame.w + pad ||
      head.y < -pad ||
      feet.y > frame.h + pad;
    if (offScreen) {
      if (s.offScreen) drawEdgeIndicator(ctx, e, m, frame, s, dist);
      continue;
    }

    const bW = bH * 0.5;
    const bX = head.x - bW * 0.5;
    const bY = head.y;

    const col = hexToRgba(s.boxColor, 1);
    const bgA = s.boxBgAlpha > 0 ? hexToRgba(s.boxColor, s.boxBgAlpha) : null;

    if (s.snapLine) drawSnapLine(ctx, frame, s, head.x, head.y);

    if (s.boxEnabled) {
      drawBox(ctx, bX, bY, bW, bH, col, s.boxThickness, bgA, s.boxStyle);
      // health bar is a fake full bar (no real health data) - not accurate
      // if (s.healthBar) drawHealthBar(ctx, bX, bY, 0, bH);
    }

    if (s.name) {
      // names are not accurate - commented out (local player box is skipped anyway)
      // if (lpLocal && e.i === lpLocal.index) {
      //   const label = "YOU";
      //   const tw = ctx.measureText(label).width;
      //   drawTextShadow(ctx, label, bX + bW * 0.5 - tw * 0.5, bY - 8, "rgb(80,255,120)");
      // }
    }

    // estimated distance from the player's on-screen box size (close = big
    // box = small number, far = small box = big number) - screen-based only
    if (s.distance) {
      const h = Math.max(bH, 6);
      const est = Math.round(2000 / h);
      const txt = `~${est}m`;
      const tw = ctx.measureText(txt).width;
      const dx = head.x - tw * 0.5;
      const dy = feet.y + 6;
      ctx.fillStyle = "rgba(0,0,0,0.45)";
      roundedRect(ctx, dx - 4, dy - 12, tw + 8, 17, 4);
      ctx.fill();
      drawTextShadow(ctx, txt, dx, dy, "rgba(255,255,255,0.9)");
    }
    }
  }
}

export default function EspCanvas({ frameRef, settingsRef, onLive }) {
  const canvasRef = useRef(null);
  const seenRef = useRef(null);
  const lastSeenRef = useRef(0);
  const lastLiveCallRef = useRef(0);
  const liveStateRef = useRef(false);

  useEffect(() => {
    let raf;
    const loop = () => {
      const frame = frameRef.current;
      const cv = canvasRef.current;
      const now = Date.now();

      // freshness is decided here, from the exact frames the canvas renders
      let fresh = false;
      if (frame) {
        if (frame !== seenRef.current) {
          seenRef.current = frame;
          lastSeenRef.current = now;
        }
        fresh = now - lastSeenRef.current < 2500;
      }

      if (cv) {
        const ctx = cv.getContext("2d");
        if (frame && fresh) {
          if (cv.width !== frame.w || cv.height !== frame.h) {
            cv.width = frame.w;
            cv.height = frame.h;
          }
          renderFrame(ctx, frame, settingsRef.current);
        } else {
          // stale or no frame -> wipe the canvas so stale ESP disappears
          ctx.clearRect(0, 0, cv.width, cv.height);
        }
      }

      if (onLive) {
        if (fresh !== liveStateRef.current) {
          liveStateRef.current = fresh;
          onLive(fresh);
        } else if (now - lastLiveCallRef.current > 500) {
          lastLiveCallRef.current = now;
          onLive(fresh);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="esp-wrap">
      <canvas ref={canvasRef} className="esp-canvas" />
    </div>
  );
}
