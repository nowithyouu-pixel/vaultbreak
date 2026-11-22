// Staged screenshot scenes: each one plays the real rules forward from a fresh
// world for a fixed time, steered by an autopilot that reads the guards' cones
// before it moves — so every frame is what a short game really looks like, and
// the same seed always gives the same frame.
import { STEP } from './config.js';
import { EVENT_CAUGHT, EVENT_WIN } from './world.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, SCREEN_WIN } from './render.js';
import { angleDiff, angleTo, distance, hasLineOfSight } from './guards.js';

const SAMPLE = STEP;

// Would any watcher see the thief standing at `pos` right now?
function watchedAt(pos, world) {
  for (const guard of world.guards) {
    if (distance(guard, pos) >= 235) continue;
    if (Math.abs(angleDiff(angleTo(guard, pos), guard.facing)) >= 0.52) continue;
    if (hasLineOfSight(guard, pos, world.blockers, world.smokes)) return true;
  }
  for (const camera of world.cameras) {
    if (distance(camera, pos) >= 250) continue;
    if (Math.abs(angleDiff(angleTo(camera, pos), camera.angle)) >= 0.42) continue;
    if (hasLineOfSight(camera, pos, world.blockers, world.smokes)) return true;
  }
  return false;
}

function noInput() {
  return { up: false, down: false, left: false, right: false, sneak: false, interact: false, coin: false, smoke: false };
}

// Waypoints per level: loot on the way, the vault, then the getaway door.
// The segments dodge the walls; the pilot waits out any cone that covers its
// next step, and only starts cracking the vault when nobody is watching.
const ROUTES = [
  [
    { x: 150, y: 120 }, { x: 150, y: 360 }, { x: 400, y: 360 }, { x: 400, y: 120 },
    { x: 700, y: 120 }, { x: 700, y: 300 }, { x: 1000, y: 300 }, { x: 1100, y: 300 },
    { x: 1100, y: 140 },
  ],
  [
    { x: 430, y: 90 }, { x: 430, y: 240 }, { x: 700, y: 240 }, { x: 700, y: 90 },
    { x: 1140, y: 120 }, { x: 1140, y: 300 }, { x: 1140, y: 560 },
  ],
  [
    { x: 200, y: 90 }, { x: 200, y: 300 }, { x: 560, y: 300 }, { x: 560, y: 120 },
    { x: 700, y: 90 }, { x: 700, y: 300 }, { x: 1000, y: 300 }, { x: 1000, y: 140 },
    { x: 200, y: 140 },
  ],
];

function hottestSuspicion(world) {
  return Math.max(0, ...world.guards.map((g) => g.suspicion), ...world.cameras.map((c) => c.suspicion));
}

function pilotInput(world, route, index) {
  const input = noInput();
  const thief = world.thief;
  // Chased: sprint straight away from the chasing guard to break line of sight.
  const chaser = world.guards.find((g) => g.state === 'chase');
  if (chaser) {
    const dx = thief.x - chaser.x;
    const dy = thief.y - chaser.y;
    const len = Math.hypot(dx, dy) || 1;
    input.right = dx / len > 0.3;
    input.left = dx / len < -0.3;
    input.down = dy / len > 0.3;
    input.up = dy / len < -0.3;
    return { input, arrived: false, retreating: true };
  }
  // Spotted or watched: fall back to the last safe waypoint until the heat dies.
  if (hottestSuspicion(world) > 0.35 || watchedAt(thief, world)) {
    const fallback = index > 0 ? route[index - 1] : { x: world.level.start.x, y: world.level.start.y };
    const dx = fallback.x - thief.x;
    const dy = fallback.y - thief.y;
    if (Math.hypot(dx, dy) < 26) return { input, arrived: false, retreating: true };
    input.right = dx > 8;
    input.left = dx < -8;
    input.down = dy > 8;
    input.up = dy < -8;
    input.sneak = true;
    return { input, arrived: false, retreating: true };
  }
  const target = route[index];
  if (!target) return { input, arrived: true, retreating: false };
  const dx = target.x - thief.x;
  const dy = target.y - thief.y;
  if (Math.hypot(dx, dy) < 26) return { input, arrived: true, retreating: false };
  // Wait where we stand if the next step walks into a cone.
  const stepX = thief.x + (dx / Math.hypot(dx, dy)) * 12;
  const stepY = thief.y + (dy / Math.hypot(dx, dy)) * 12;
  if (watchedAt({ x: stepX, y: stepY }, world)) return { input, arrived: false, retreating: false };
  input.right = dx > 8;
  input.left = dx < -8;
  input.down = dy > 8;
  input.up = dy < -8;
  // Sneak when a guard is close: slower, but far harder to spot.
  input.sneak = world.guards.some((g) => Math.hypot(g.x - thief.x, g.y - thief.y) < 260);
  return { input, arrived: false, retreating: false };
}

function driveRoute(world, route, seconds, stopAtExit) {
  let index = 0;
  const exit = { x: world.exit.x + world.exit.w / 2, y: world.exit.y + world.exit.h / 2 };
  const steps = Math.floor(seconds / STEP);
  for (let i = 0; i < steps; i += 1) {
    if (world.over) break;
    const thief = world.thief;
    if (world.diamondTaken && stopAtExit) {
      const { input, arrived } = pilotInput(world, [exit], 0);
      if (arrived) break;
      world.step(STEP, input);
      continue;
    }
    // Cracking: stand by the vault and hold E, but only when unwatched and cool.
    const nearVault = Math.hypot(thief.x - world.vaultCentre.x, thief.y - world.vaultCentre.y) < 95;
    if (nearVault && !world.vaultOpen) {
      const input = noInput();
      if (!watchedAt(thief, world) && hottestSuspicion(world) < 0.3) input.interact = true;
      world.step(STEP, input);
      continue;
    }
    const { input, arrived, retreating } = pilotInput(world, route, index);
    if (arrived && !retreating) index += 1;
    const events = world.step(STEP, input);
    if (events & EVENT_WIN || events & EVENT_CAUGHT) break;
  }
}

/**
 * Set `world` to the named scene and return the screen to draw over it.
 * Scenes: heist (mid-job, everything visible), title, alarm (caught), getaway.
 */
export function stageShot(name, world) {
  world.reset();
  if (name === 'title') {
    for (let i = 0; i < 5 / STEP; i += 1) world.step(STEP, noInput());
    return { screen: SCREEN_TITLE, best: 0 };
  }
  if (name === 'alarm') {
    // A hurried thief walks straight at the vault and never waits: the cones catch him.
    const vault = world.vaultCentre;
    for (let i = 0; i < 90 / STEP; i += 1) {
      if (world.over) break;
      const input = noInput();
      const dx = vault.x - world.thief.x;
      const dy = vault.y - world.thief.y;
      input.right = dx > 8;
      input.left = dx < -8;
      input.down = dy > 8;
      input.up = dy < -8;
      const events = world.step(STEP, input);
      if (events & EVENT_CAUGHT) break;
    }
    if (!world.over) {
      // Fallback: march into the nearest guard's cone until the alarm maxes out.
      const guard = world.guards[0];
      for (let i = 0; i < 60 / STEP && !world.over; i += 1) {
        const input = noInput();
        input.right = guard.x > world.thief.x + 8;
        input.left = guard.x < world.thief.x - 8;
        input.down = guard.y > world.thief.y + 8;
        input.up = guard.y < world.thief.y - 8;
        world.step(STEP, input);
      }
    }
    return { screen: world.won ? SCREEN_WIN : SCREEN_OVER, best: world.score };
  }
  if (name === 'getaway') {
    driveRoute(world, ROUTES[world.levelIndex], 240, true);
    return { screen: world.won ? SCREEN_WIN : world.over ? SCREEN_OVER : SCREEN_PLAY, best: world.score };
  }
  // Default: heist — partway through the job, thief deep in the room.
  driveRoute(world, ROUTES[world.levelIndex], 16, false);
  return { screen: SCREEN_PLAY, best: world.score };
}
