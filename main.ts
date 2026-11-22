// Vaultbreak's hand-in program (Node 22, standard library only).
//
// The game itself is plain static files under game/ — index.html plus ES
// modules, no libraries, no network — and the screenshots in screenshots/ are
// frames of that game taken in a desktop browser. This program copies both
// folders into the grader's output directory and writes dossier.json, the
// summary the judge reads, using the vendored make.fun helper. Run it locally
// with MAKEFUN_OUTPUT_DIR set to stand in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the game for play-testing with `node serve.ts` (http://localhost:8080).

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (from the kit's reference/gate.json): only
// text_max_bytes shapes the dossier's bytes; the rest refuse an entry the
// scorer would refuse — more than 4 screenshots or one over 256 KiB, more
// than 993 files or 48 MiB under game/, or a game/ path over 1000 bytes
// (game/ counts beside /output's own 1000-entry cap, its screenshots/ and
// dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
