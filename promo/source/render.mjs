// Drives the film page in headless Chromium and writes one JPEG per frame.
//   node render.mjs --out frames --from 0 --to 2520     contiguous range
//   node render.mjs --out preview --times 2.5,9,16      sparse preview stills
//   node render.mjs --cues cues.json                     dump the sound-cue list
import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, arr) => {
  if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1]]);
  return acc;
}, []));
const port = args.port || 8123;

const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--disable-gpu-vsync"],
});
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
page.on("pageerror", (e) => console.error("[pageerror]", e.message));
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") console.error(`[${m.type()}]`, m.text()); });
await page.goto(`http://127.0.0.1:${port}/web/index.html`);
await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });

if (args.cues) {
  fs.writeFileSync(args.cues, JSON.stringify(await page.evaluate(() => window.__cues), null, 1));
  console.log("cues written");
}

if (args.out) {
  fs.mkdirSync(args.out, { recursive: true });
  const fps = 30;
  const frames = args.times
    ? args.times.split(",").map((s) => Math.round(parseFloat(s) * fps))
    : Array.from({ length: (+args.to) - (+args.from) }, (_, i) => +args.from + i);
  const t0 = Date.now();
  for (const [n, f] of frames.entries()) {
    const file = path.join(args.out, args.times ? `t${(f / fps).toFixed(2)}.jpg` : `f${String(f).padStart(5, "0")}.jpg`);
    if (!args.times && fs.existsSync(file) && fs.statSync(file).size > 0) continue;
    await page.evaluate((fr) => window.__render(fr), f);
    const buf = await page.screenshot({ type: "jpeg", quality: 94 });
    fs.writeFileSync(file + ".tmp", buf);
    fs.renameSync(file + ".tmp", file);
    if (n % 30 === 0) {
      const per = (Date.now() - t0) / (n + 1);
      console.log(`[${args.from ?? "preview"}] frame ${f} (${n + 1}/${frames.length}) ${per.toFixed(0)} ms/frame`);
    }
  }
}
await browser.close();
