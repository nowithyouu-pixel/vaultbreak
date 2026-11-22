// Vaultbreak entry point: fixed-step loop, screens, and the ?shot= scenes the
// screenshots are taken from. No network, no build step — plain ES modules.
import { FIELD, STEP } from './config.js';
import { World, EVENT_CAUGHT, EVENT_LOOT, EVENT_VAULT, EVENT_WIN } from './world.js';
import { render, SCREEN_TITLE, SCREEN_PLAY, SCREEN_OVER, SCREEN_WIN, SCREEN_PAUSE } from './render.js';
import { makeInput, attachInput, consumeOneShots } from './input.js';
import { makeAudio } from './audio.js';
import { stageShot } from './shots.js';
import { LEVELS } from './levels.js';

const canvas = document.getElementById('game');
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const ctx = canvas.getContext('2d');
const status = document.getElementById('status');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 1);
const shot = params.get('shot');

const audio = makeAudio();
const input = makeInput();
let world = new World(0, seed);
let screen = SCREEN_TITLE;
let best = 0;
let paused = false;
let accumulator = 0;
let last = performance.now();

function announce() {
  const loot = world.loot.filter((i) => !i.taken).length;
  status.textContent = screen === SCREEN_TITLE
    ? 'Vaultbreak title screen. Press Enter to start.'
    : `${world.level.name}. Score $${world.score}. Alarm ${Math.round(world.alarm)}. Loot left ${loot}. ${world.diamondTaken ? 'Diamond taken — reach the exit.' : 'Crack the vault.'}`;
}

function startLevel(index) {
  world = new World(index, seed + index);
  screen = SCREEN_PLAY;
  paused = false;
  announce();
}

function nextScreen() {
  if (screen === SCREEN_TITLE) {
    startLevel(0);
  } else if (screen === SCREEN_WIN) {
    if (world.levelIndex + 1 >= LEVELS.length) startLevel(0);
    else startLevel(world.levelIndex + 1);
  } else if (screen === SCREEN_OVER) {
    screen = SCREEN_TITLE;
    world = new World(0, seed);
    announce();
  }
}

attachInput(input, canvas, {
  onPause() {
    if (screen === SCREEN_PLAY) {
      paused = !paused;
      screen = paused ? SCREEN_PAUSE : SCREEN_PLAY;
      announce();
    }
  },
  onMute() { audio.toggleMute(); },
  onRestart() {
    if (screen === SCREEN_PLAY || screen === SCREEN_OVER || screen === SCREEN_PAUSE) startLevel(world.levelIndex);
  },
  onConfirm() {
    audio.unlock();
    if (screen !== SCREEN_PLAY && screen !== SCREEN_PAUSE) nextScreen();
  },
});

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  if (screen === SCREEN_PLAY && !paused) {
    accumulator += elapsed;
    while (accumulator >= STEP) {
      accumulator -= STEP;
      const events = world.step(STEP, input);
      consumeOneShots(input);
      if (events & EVENT_LOOT) audio.loot();
      if (events & EVENT_VAULT) audio.crack();
      if (world.alarm > 55 && world.spotted) audio.alarm();
      if (events & EVENT_CAUGHT) {
        screen = SCREEN_OVER;
        best = Math.max(best, world.score);
        audio.caught();
        announce();
        break;
      }
      if (events & EVENT_WIN) {
        screen = SCREEN_WIN;
        best = Math.max(best, world.score);
        audio.win();
        announce();
        break;
      }
    }
  }
  render(ctx, world, screen, best);
  window.__screen = screen;
  requestAnimationFrame(frame);
}

if (shot) {
  // Screenshot mode: stage one fixed scene, draw it once, signal readiness.
  const staged = stageShot(shot, world);
  screen = staged.screen;
  best = staged.best;
  render(ctx, world, screen, best);
  window.__shotReady = true;
} else {
  announce();
  requestAnimationFrame(frame);
}
