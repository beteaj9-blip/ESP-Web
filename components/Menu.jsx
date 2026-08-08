"use client";

import { useState } from "react";
import { BOX_STYLES, SNAP_ORIGINS, PRESETS, applyPreset } from "./settings";

function Toggle({ label, checked, onChange, indent }) {
  return (
    <div className="row" style={indent ? { paddingLeft: 18 } : null}>
      <span className="label">{label}</span>
      <label className="switch">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="track" />
        <span className="knob" />
      </label>
    </div>
  );
}

function Section({ title }) {
  return (
    <div className="section">
      <span className="bar" />
      <span>{title}</span>
    </div>
  );
}

function Slider({ label, value, min, max, step, fmt, onChange }) {
  return (
    <div className="row slider-row" style={{ flexDirection: "column", alignItems: "stretch" }}>
      <div className="label" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>{label}</span>
        <span className="val">{fmt(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

function Combo({ label, options, value, onChange }) {
  return (
    <div style={{ padding: "6px 0 6px 18px" }}>
      <div className="label dim" style={{ marginBottom: 4 }}>{label}</div>
      <select value={value} onChange={(e) => onChange(parseInt(e.target.value, 10))}>
        {options.map((o, i) => (
          <option key={i} value={i}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function ColorRow({ label, value, onChange }) {
  return (
    <div className="color-row">
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
      <span className="label">{label}</span>
    </div>
  );
}

function Dot({ on, text, accent }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: accent ?? (on ? "var(--green)" : "var(--text-dim)") }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: on ? "rgb(50,220,100)" : "rgb(180,50,50)",
        }}
      />
      {text}
    </span>
  );
}

export default function Menu({ settings, setSettings, status }) {
  const [tab, setTab] = useState(0);
  const [collapsed, setCollapsed] = useState(false);

  const set = (patch) => setSettings((s) => ({ ...s, ...patch }));

  return (
    <div className="menu">
      <div className="gradient-bar" />
      <div className="header">
        <span className="title">MRXCEPTION</span>
        <div className="chrome">
          <button className="chrome-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? "+" : "-"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
          <div className="tabs">
            <button className={`tab ${tab === 0 ? "active" : ""}`} onClick={() => setTab(0)}>Visuals</button>
            <button className={`tab ${tab === 1 ? "active" : ""}`} onClick={() => setTab(1)}>Colors</button>
            <button className={`tab ${tab === 2 ? "active" : ""}`} onClick={() => setTab(2)}>Info</button>
          </div>

          <div className="body">
            {tab === 0 && (
              <>
                <Section title="Player ESP" />
                <Toggle label="Enable ESP" checked={settings.espEnabled} onChange={(v) => set({ espEnabled: v })} />

                {settings.espEnabled && (
                  <>
                    <Toggle label="Enable Box" checked={settings.boxEnabled} onChange={(v) => set({ boxEnabled: v })} indent />
                    {settings.boxEnabled && (
                      <>
                        <Combo
                          label="Style"
                          options={BOX_STYLES}
                          value={settings.boxStyle}
                          onChange={(v) => set({ boxStyle: v })}
                        />
                        {settings.boxStyle === 3 && (
                          <Slider
                            label="BG Opacity"
                            value={settings.boxBgAlpha}
                            min={0}
                            max={0.5}
                            step={0.01}
                            fmt={(v) => v.toFixed(2)}
                            onChange={(v) => set({ boxBgAlpha: v })}
                          />
                        )}
                    {/* not accurate - commented out
                    <Toggle label="Health Bar" checked={settings.healthBar} onChange={(v) => set({ healthBar: v })} indent />
                    */}
                  </>
                )}

                    <Toggle label="Enable Snap Line" checked={settings.snapLine} onChange={(v) => set({ snapLine: v })} indent />
                    {settings.snapLine && (
                      <Combo
                        label="Origin"
                        options={SNAP_ORIGINS}
                        value={settings.snapLinePos}
                        onChange={(v) => set({ snapLinePos: v })}
                      />
                    )}

                    {/* slot indexes are not real names - commented out
                    <Toggle label="Player Name" checked={settings.name} onChange={(v) => set({ name: v })} indent />
                    */}
                    <Toggle label="Distance" checked={settings.distance} onChange={(v) => set({ distance: v })} indent />
                    <Toggle label="Crosshair" checked={settings.crosshair} onChange={(v) => set({ crosshair: v })} indent />
                    <Toggle label="Off-Screen Indicator" checked={settings.offScreen} onChange={(v) => set({ offScreen: v })} indent />
                    <Toggle label="Local Player Detect" checked={settings.localDetect} onChange={(v) => set({ localDetect: v })} indent />
                  </>
                )}

                <Section title="Render" />
                <Slider
                  label="Max Distance  (0 = All Player)"
                  value={settings.maxDist}
                  min={0}
                  max={2000}
                  step={10}
                  fmt={(v) => (v <= 0 ? "No Limit" : `${v} m`)}
                  onChange={(v) => set({ maxDist: v })}
                />
                <Slider
                  label="Head Offset"
                  value={settings.headOffset}
                  min={0.5}
                  max={1.5}
                  step={0.01}
                  fmt={(v) => v.toFixed(2)}
                  onChange={(v) => set({ headOffset: v })}
                />
                <Slider
                  label="Feet Offset"
                  value={settings.feetOffset}
                  min={0}
                  max={0.5}
                  step={0.01}
                  fmt={(v) => v.toFixed(2)}
                  onChange={(v) => set({ feetOffset: v })}
                />
              </>
            )}

            {tab === 1 && (
              <>
                <Section title="ESP Colors" />
                <ColorRow label="Box Color" value={settings.boxColor} onChange={(v) => set({ boxColor: v })} />
                <ColorRow label="Snap Line" value={settings.lineColor} onChange={(v) => set({ lineColor: v })} />
                <ColorRow label="Text / Labels" value={settings.textColor} onChange={(v) => set({ textColor: v })} />
                <ColorRow label="Crosshair" value={settings.crosshairColor} onChange={(v) => set({ crosshairColor: v })} />

                <Section title="ESP Quick Preset" />
                <select
                  defaultValue={-1}
                  onChange={(e) => {
                    const i = parseInt(e.target.value, 10);
                    if (i >= 0) setSettings((s) => applyPreset(s, PRESETS[i]));
                  }}
                >
                  <option value={-1} disabled>Pick a preset...</option>
                  {PRESETS.map((p, i) => (
                    <option key={i} value={i}>{p.name}</option>
                  ))}
                </select>
              </>
            )}

            {tab === 2 && (
              <>
                <Section title="Status" />
                <div className="stat-card">
                  <span className={`dot ${status.dll ? "on" : ""}`} />
                  <span className="name">DLL Connection</span>
                  <span className={`state ${status.dll ? "on" : ""}`}>
                    {status.dll ? "Connected" : "Disconnected"}
                  </span>
                </div>
                <div className="stat-card">
                  <span className={`dot ${status.matrix ? "on" : ""}`} />
                  <span className="name">View Matrix</span>
                  <span className={`state ${status.matrix ? "on" : ""}`}>
                    {status.matrix ? "Active" : "Waiting"}
                  </span>
                </div>
                <div className="stat-card">
                  <span className={`dot ${status.players > 0 ? "on" : ""}`} />
                  <span className="name">Players</span>
                  <span className={`state ${status.players > 0 ? "on" : ""}`}>
                    {status.players > 0 ? `${status.players}` : "Waiting"}
                  </span>
                </div>
                <div className="stat-card">
                  <span className={`dot ${status.live ? "on" : ""}`} />
                  <span className="name">Data Feed</span>
                  <span className={`state ${status.live ? "on" : ""}`}>
                    {status.live ? "Live" : "Offline"}
                  </span>
                </div>

                <Section title="Live Statistics" />
                <div className="info-line">
                  <span>Session:</span>
                  <b>{status.token}</b>
                </div>
                <div className="info-line">
                  <span>Entities:</span>
                  <b>{status.players}</b>
                </div>
                <div className="info-line">
                  <span>Updates / sec:</span>
                  <b>{status.fps} fps</b>
                </div>
                <div className="info-line">
                  <span>Screen:</span>
                  <b>{status.w}x{status.h}</b>
                </div>

                <Section title="Credits" />
                <div className="info-line">
                  <span>Developed By</span>
                  <b style={{ color: "#8c63ff" }}>MRXCEPTION</b>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
