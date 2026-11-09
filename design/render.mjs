// Renders profile.html parts to PNGs in ../assets/v2 with headless Chrome (2x), then trims the buttons.
// Usage: node design/render.mjs [part ...]   (no args = everything)
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "..", "assets", "v2");
fs.mkdirSync(out, { recursive: true });
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";

const themed = { hero: [1200, 460], feature: [1200, 420], pilupu: [590, 420], showroom: [590, 420] };
for (const k of ["kanaka", "ramen", "drishti", "chitra", "madhuram", "sixer"]) themed[k] = [590, 400];
const single = { cta: [1200, 210] };
for (const k of ["website", "showroom", "whatsapp", "instagram", "linkedin"]) single[`btn-${k}`] = [320, 50];

const jobs = [];
for (const [p, size] of Object.entries(themed)) for (const t of ["light", "dark"]) jobs.push({ p, t, size, file: `${p}-${t}.png` });
for (const [p, size] of Object.entries(single)) jobs.push({ p, t: "light", size, file: `${p}.png` });
const wanted = process.argv.slice(2);
const todo = wanted.length ? jobs.filter((j) => wanted.includes(j.p)) : jobs;

function render({ p, t, size, file }) {
  const url = `${pathToFileURL(path.join(here, "profile.html")).href}?p=${p}&t=${t}`;
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), "gh-profile-"));
  return new Promise((resolve) => {
    const c = spawn(CHROME, [
      "--headless=new", "--hide-scrollbars", "--no-first-run", `--user-data-dir=${profile}`,
      "--force-device-scale-factor=2", "--default-background-color=00000000",
      "--virtual-time-budget=8000", "--allow-file-access-from-files",
      `--window-size=${size[0]},${size[1]}`, `--screenshot=${path.join(out, file)}`, url,
    ], { stdio: "ignore" });
    c.on("exit", () => { fs.rmSync(profile, { recursive: true, force: true }); console.log("ok", file); resolve(); });
  });
}

for (let i = 0; i < todo.length; i += 4) await Promise.all(todo.slice(i, i + 4).map(render));
