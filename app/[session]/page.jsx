"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import EspCanvas from "@/components/EspCanvas";
import { loadSettings, saveSettings } from "@/components/settings";

//  relay host = wherever the page was loaded from (works from phone via LAN IP)
const WS_BASE =
  process.env.NEXT_PUBLIC_WS_URL ||
  `ws://${typeof window !== "undefined" ? window.location.hostname : "localhost"}:8080`;

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  let session = params.session || "";
  try {
    session = decodeURIComponent(session);
  } catch {
    /* already decoded */
  }

  const [settings, setSettings] = useState(() => loadSettings());
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const frameRef = useRef(null);

  const [status, setStatus] = useState({
    matrix: false,
    players: 0,
    live: false,
    dll: false,
    alive: false,
    lastFrameAt: 0,
    token: session,
    fps: 0,
    w: 0,
    h: 0,
  });

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // phone: portrait => show "landscape only" overlay
  const [portrait, setPortrait] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const check = () => setPortrait(coarse && window.innerHeight > window.innerWidth);
    check();
    window.addEventListener("resize", check);
    window.addEventListener("orientationchange", check);
    return () => {
      window.removeEventListener("resize", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  // phone: keep the screen awake while the overlay is open
  useEffect(() => {
    if (typeof window === "undefined" || !("wakeLock" in navigator)) return;
    let lock = null;
    const request = () => {
      navigator.wakeLock
        .request("screen")
        .then((l) => {
          lock = l;
        })
        .catch(() => {
          /* denied or non-secure context - ignore */
        });
    };
    request();
    const onVis = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      if (lock) lock.release().catch(() => {});
    };
  }, []);

  // page phase: "wait" (token valid, no data yet) | "invalid" | "live"
  const [phase, setPhase] = useState("wait");
  const validRef = useRef(false);
  const invalidTimerRef = useRef(null);
  const lastStatusRef = useRef(0);

  // the canvas decides freshness - the dot simply mirrors what it renders
  const onLive = useCallback((live) => {
    setStatus((s) => (s.dll !== live ? { ...s, dll: live } : s));
  }, []);

  // websocket connection
  useEffect(() => {
    let ws = null;
    let closed = false;
    let retryTimer = null;

    const connect = () => {
      if (closed) return;
      try {
        ws = new WebSocket(`${WS_BASE}/ws?token=${encodeURIComponent(session)}`);
      } catch {
        retryTimer = setTimeout(connect, 2000);
        return;
      }

      ws.onopen = () => {
        setStatus((s) => ({ ...s, live: true, token: session }));
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.type === "frame" && msg.frame) {
            frameRef.current = msg.frame;
            setPhase((p) => (p === "live" ? p : "live"));
            // status/state updates throttled - the canvas reads frameRef directly
            // in its own RAF loop, so React re-renders are pure overhead here
            const now = Date.now();
            if (now - lastStatusRef.current > 200) {
              lastStatusRef.current = now;
              setStatus((s) => ({
                ...s,
                dll: true,
                lastFrameAt: now,
                matrix: !!msg.frame.m,
                players: msg.frame.p ? msg.frame.p.length : 0,
                w: msg.frame.w || 0,
                h: msg.frame.h || 0,
                fps: Math.round(1000 / Math.max(1, now - (s.lastFrameAt || now))),
              }));
            }
          } else if (msg.type === "dll") {
            setStatus((s) => ({ ...s, alive: !!msg.connected }));
          } else if (msg.type === "hello") {
            // session exists in the relay => the DLL is alive, even without ESP data
            setStatus((s) => ({ ...s, alive: !!msg.dll }));
            if (msg.hasData) {
              // valid token - the DLL is (or will be) streaming
              validRef.current = true;
              if (invalidTimerRef.current) {
                clearTimeout(invalidTimerRef.current);
                invalidTimerRef.current = null;
              }
            } else if (!validRef.current && !invalidTimerRef.current) {
              // no session yet - grace period, then call it invalid
              invalidTimerRef.current = setTimeout(() => {
                setPhase((p) => (p === "live" ? p : "invalid"));
                invalidTimerRef.current = null;
              }, 4000);
            }
          }
        } catch {
          /* ignore */
        }
      };

      ws.onclose = () => {
        frameRef.current = null;
        setStatus((s) => ({ ...s, live: false, dll: false, alive: false }));
        if (!closed) retryTimer = setTimeout(connect, 2000);
      };
      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          /* ignore */
        }
      };
    };

    connect();
    return () => {
      closed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) ws.close();
    };
  }, [session]);

  const live = status.live;

  // green = DLL is alive (heartbeat) or ESP frames are flowing right now
  const dotClass = status.dll || status.alive ? "green" : live ? "yellow" : "red";

  return (
    <>
      <EspCanvas frameRef={frameRef} settingsRef={settingsRef} onLive={onLive} />
      {portrait && (
        <div className="landscape-overlay">
          <div className="landscape-card">
            <div className="landscape-icon">&#8635;</div>
            <div>Please rotate your device</div>
            <div className="sub">Landscape only</div>
          </div>
        </div>
      )}
      {phase !== "live" && (
        <div className="wait-overlay">
          <div className="wait-card">
            {phase === "invalid" ? (
              <>
                <div className="wait-title bad">Invalid token</div>
              </>
            ) : (
              <>
                <div className="spinner" />
                <div className="wait-title">Please wait</div>
                <div className="wait-sub">Waiting for data...</div>
              </>
            )}
          </div>
        </div>
      )}
      <div className="status-pill">
        <span className={`dot ${dotClass}`} />
      </div>
    </>
  );
}
