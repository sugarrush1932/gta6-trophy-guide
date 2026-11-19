// take-screenshots.mjs — renders the scenes in shots.json with a headless Chrome and
// writes screenshots/*.jpg. The screenshots are the app's own renders: this script only
// serves app/, opens each scene URL and captures the viewport; it never edits a pixel.
//
// Run: node take-screenshots.mjs   (needs a Chrome/Chromium binary; CHROME_BIN overrides)

import { execFileSync, spawn } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const chrome = process.env.CHROME_BIN
  ?? `${process.env.HOME}/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell`;
const scenes = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));

const server = spawn('node', [join(here, 'serve.ts')], { stdio: 'ignore' });
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

try {
  await wait(900);
  mkdirSync(join(here, 'screenshots'), { recursive: true });
  for (const scene of scenes) {
    const raw = join(tmpdir(), `tg-${scene.file}.png`);
    const profile = join(tmpdir(), `tg-profile-${scene.file}`);
    execFileSync(chrome, [
      '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
      `--window-size=${scene.w},${scene.h}`,
      `--user-data-dir=${profile}`,
      '--virtual-time-budget=6000',
      `--screenshot=${raw}`,
      `http://localhost:8080/${scene.query}`,
    ], { stdio: 'inherit' });
    // Convert to JPEG at a quality that keeps every screenshot under the 256 KiB gate.
    execFileSync('python3', ['-c', `
from PIL import Image
import sys
img = Image.open(sys.argv[1]).convert('RGB')
img.save(sys.argv[2], 'JPEG', quality=82, optimize=True)
`, raw, join(here, 'screenshots', scene.file)]);
    rmSync(profile, { recursive: true, force: true });
    console.log('shot', scene.file);
  }
} finally {
  server.kill();
}
