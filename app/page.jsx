"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const go = (t) => {
    const v = t.trim();
    if (!v) return;
    router.push(`/${encodeURIComponent(v)}`);
  };

  return (
    <div className="landing">
      <div className="card">
        <div className="gradient-bar" />
        <div className="inner">
          <h1>MRXCEPTION</h1>
          <div className="sub">Knives Out - Web ESP</div>
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && go(token)}
            placeholder="Session token..."
            autoFocus
          />
          <div className="btns">
            <button className="primary" onClick={() => go(token)}>
              Connect
            </button>
          </div>
          <div className="hint">^_^</div>
        </div>
      </div>
    </div>
  );
}
