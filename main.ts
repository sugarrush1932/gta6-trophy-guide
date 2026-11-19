// Vice Got a Price! — the Leonida platinum companion for gta6-trophy-guide-01.
//
// The entry is a static, offline web app under app/: a trophy guide and tracker for the 55
// PlayStation 5 trophies of Grand Theft Auto VI. This program is only the hand-in step: it
// copies app/ and screenshots/ into the output directory and writes dossier.json with the
// vendored make.fun library, byte for byte as the scorer rebuilds it. The vendored library
// under vendor/ is the kit's own copy and must not be edited.
//
// Run it the way the grader does (MAKEFUN_OUTPUT_DIR stands in for /output outside it):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the guide locally with: node serve.ts  (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The app ships exactly as authored: no build step, nothing fetched, nothing transformed.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// Screenshots are the maker's own renders of the app (see shots.json for the scenes).
// The gate refuses an entry with none, so fail loudly here rather than hand in a
// guideless dossier: a missing screenshots/ directory is a build mistake, not a state
// this program should paper over.
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (!existsSync(join(repoRoot, 'screenshots'))) {
  throw new Error('screenshots/ is missing: capture the scenes in shots.json before handing in');
}
cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });

// The dossier options are the scorer's own caps for this bounty: at most 4 screenshots of
// 256 KiB each, at most 993 files and 48 MiB under app/, and the 160 KiB source text cap.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

writeFileSync(join(outputDir, 'dossier.json'), buildDossier(outputDir, DOSSIER_CAPS));
