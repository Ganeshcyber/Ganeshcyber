// Saves frames of an animated part of profile.html, stepping CSS animations by hand so the loop is exact.
// Usage: node design/frames.mjs <part> <light|dark> <seconds> <fps> <scale> <width> <height> <outDir>
// finish-anim.py then joins the frames into an animated WebP.
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const [part, theme, secs, fps, scale, w, h, outDir] = process.argv.slice(2);
const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = 9400 + Math.floor(Math.random() * 300);
const profile = fs.mkdtempSync(path.join(os.tmpdir(), "gh-frames-"));
const url = `${pathToFileURL(path.join(here, "profile.html")).href}?p=${part}&t=${theme}`;
const chrome = spawn("C:/Program Files/Google/Chrome/Application/chrome.exe", [
  `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--headless=new", "--hide-scrollbars",
  "--no-first-run", "--allow-file-access-from-files", `--window-size=${w},${h}`, url,
], { stdio: "ignore" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let target;
for (let i = 0; i < 80 && !target; i++) {
  await sleep(250);
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json`)).json()).find((t) => t.type === "page"); } catch {}
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const waiting = new Map();
ws.onmessage = (e) => { const m = JSON.parse(e.data); if (waiting.has(m.id)) { waiting.get(m.id)(m.result); waiting.delete(m.id); } };
const send = (method, params = {}) => new Promise((r) => { waiting.set(++id, r); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = (expression) => send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });

await send("Emulation.setDeviceMetricsOverride", { width: +w, height: +h, deviceScaleFactor: +scale, mobile: false });
await send("Emulation.setDefaultBackgroundColorOverride", { color: { r: 0, g: 0, b: 0, a: 0 } });
await evaluate(`(async () => { await document.fonts.ready;
  await Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => (i.onload = i.onerror = r))));
  await new Promise((r) => setTimeout(r, 500)); return 1; })()`);

fs.mkdirSync(outDir, { recursive: true });
const count = Math.round(+secs * +fps);
for (let f = 0; f < count; f++) {
  const t = (f * 1000) / +fps;
  await evaluate(`document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ${t}; }); new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))`);
  const shot = await send("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(path.join(outDir, `${String(f).padStart(3, "0")}.png`), Buffer.from(shot.data, "base64"));
}
ws.close();
chrome.kill();
await sleep(500);
try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} // Chrome can still hold files open
console.log(`${part}-${theme}: ${count} frames`);
