//  ESP settings - same defaults as the in-game DLL menu (everything ON)
export const DEFAULTS = {
  espEnabled: true,
  boxEnabled: true,
  boxStyle: 1,          // 0 full, 1 corner, 2 rounded, 3 corner+bg
  boxBgAlpha: 0.12,
  boxThickness: 1.8,
  boxColor: "#00ff6b",
  healthBar: true,
  snapLine: true,
  snapLinePos: 0,       // 0 top, 1 center, 2 bottom
  lineColor: "#6699ff",
  name: true,
  distance: true,
  textColor: "#ffffff",
  crosshair: true,
  crosshairColor: "#ff3333",
  offScreen: true,      // edge indicators for off-screen enemies
  localDetect: true,    // mark local player = entity closest to screen center
  maxDist: 0,           // 0 = no limit (default like before) - raise/limit in menu if desired
  headOffset: 0.8,
  feetOffset: 0.1,
};

export const BOX_STYLES = ["Full Box", "Corner Box", "Rounded Box", "Corner+BG"];
export const SNAP_ORIGINS = ["Top", "Center", "Bottom"];

//  in-game ESP quick presets (Neon / Red / Ice / Gold)
export const PRESETS = [
  { name: "Neon", box: "#00ff6b", line: "#00ffcc", text: "#00ffff", ch: "#00ff80" },
  { name: "Red", box: "#ff2626", line: "#ff4d1a", text: "#ffd138", ch: "#ff0000" },
  { name: "Ice", box: "#4d99ff", line: "#66b3ff", text: "#d1e6ff", ch: "#80ccff" },
  { name: "Gold", box: "#ffcc00", line: "#ffb800", text: "#ffeb66", ch: "#ffc700" },
];

const KEY = "koesp-settings-v7";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(s) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export function applyPreset(s, preset) {
  return {
    ...s,
    boxColor: preset.box,
    lineColor: preset.line,
    textColor: preset.text,
    crosshairColor: preset.ch,
  };
}

export function hexToRgba(hex, a) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${a})`;
}
