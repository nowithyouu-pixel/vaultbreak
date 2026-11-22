// World state: one level's live objects, the alarm meter, loot, tools and the
// win/lose rules. Pure simulation — no drawing, no input — so the screenshot
// autopilot can drive it with the exact same steps a player takes.
import { FIELD, STEP, ALARM, SCORE, TOOLS } from './config.js';
import { LEVELS } from './levels.js';
import { makeGuard, makeCamera, stepGuard, stepCamera, alertGuardsToNoise } from './guards.js';
import { makeThief, stepThief } from './thief.js';

export const EVENT_NONE = 0;
export const EVENT_CAUGHT = 1;
export const EVENT_WIN = 2;
export const EVENT_VAULT = 4;
export const EVENT_LOOT = 8;
export const EVENT_SPOTTED = 16;

export class World {
  constructor(levelIndex, seed) {
    this.levelIndex = levelIndex;
    this.level = LEVELS[levelIndex];
    this.seed = seed;
    this.field = FIELD;
    this.reset();
  }

  reset() {
    const level = this.level;
    this.thief = makeThief(level.start);
    this.guards = level.guards.map(makeGuard);
    this.cameras = level.cameras.map(makeCamera);
    this.loot = level.loot.map((item) => ({ ...item, taken: false }));
    this.solids = [...level.walls, ...level.crates];
    this.blockers = this.solids;
    this.vault = level.vault;
    this.vaultCentre = { x: level.vault.x + level.vault.w / 2, y: level.vault.y + level.vault.h / 2 };
    this.exit = level.exit;
    this.vaultOpen = false;
    this.diamondTaken = false;
    this.alarm = 0;
    this.score = 0;
    this.time = 0;
    this.over = false;
    this.won = false;
    this.spotted = false;
    this.everSpotted = false;
    this.smokes = [];
    this.coinsThrown = [];
    this.noise = null;
    this.message = '';
    this.messageLeft = 0;
    this.crackSeconds = TOOLS.crackSeconds;
  }

  inShadow(pos) {
    return this.level.shadows.some((s) => pos.x >= s.x && pos.x <= s.x + s.w && pos.y >= s.y && pos.y <= s.y + s.h);
  }

  onVaultOpened() {
    this.score += SCORE.diamond;
    this.diamondTaken = true;
    this.vaultJustOpened = true;
    this.flash('VAULT CRACKED — the Star Diamond is yours. Get to the door!');
  }

  flash(text) {
    this.message = text;
    this.messageLeft = 3;
  }

  throwCoin(x, y) {
    if (this.thief.coins <= 0) return false;
    this.thief.coins -= 1;
    this.coinsThrown.push({ x, y, timeLeft: 1.2 });
    alertGuardsToNoise(this.guards, x, y, TOOLS.coinLureRadius);
    this.flash('Coin tossed — the guards go to look.');
    return true;
  }

  throwSmoke() {
    if (this.thief.smokes <= 0) return false;
    this.thief.smokes -= 1;
    this.smokes.push({ x: this.thief.x, y: this.thief.y, r: TOOLS.smokeRadius, timeLeft: TOOLS.smokeSeconds });
    this.flash('Smoke out — their cones cannot see through it.');
    return true;
  }

  // Advance the simulation one fixed step. `input` is the same shape the
  // keyboard handler builds. Returns a bitmask of EVENT_* flags.
  step(dt, input) {
    if (this.over) return EVENT_NONE;
    this.time += dt;
    let events = EVENT_NONE;
    const thief = this.thief;

    if (input.coin) this.throwCoin(input.coinX, input.coinY);
    if (input.smoke) this.throwSmoke();

    stepThief(thief, input, dt, this);
    if (this.vaultJustOpened) {
      events |= EVENT_VAULT;
      this.vaultJustOpened = false;
    }

    let anySeen = false;
    for (const guard of this.guards) {
      if (stepGuard(guard, dt, this)) anySeen = true;
    }
    for (const camera of this.cameras) {
      if (stepCamera(camera, dt, this)) anySeen = true;
    }
    this.spotted = anySeen;
    if (anySeen) this.everSpotted = true;

    // Noise pulls patrolling guards over to investigate.
    if (this.noise && this.noise.timeLeft > 0) {
      this.noise.timeLeft -= dt;
      alertGuardsToNoise(this.guards, this.noise.x, this.noise.y, this.noise.radius);
    }

    // Alarm rises while any watcher is hot, and cools when the room is calm.
    const hottest = Math.max(0, ...this.guards.map((g) => g.suspicion), ...this.cameras.map((c) => c.suspicion));
    if (hottest >= ALARM.hotSuspicion) {
      this.alarm = Math.min(100, this.alarm + ALARM.riseRate * dt);
      if (this.alarm > 55 && !this._alarmWarned) {
        this._alarmWarned = true;
        this.flash('ALARM RISING — break line of sight!');
      }
    } else {
      this.alarm = Math.max(0, this.alarm - ALARM.decayRate * dt);
      if (this.alarm < 30) this._alarmWarned = false;
    }

    // Loot pickup by touch.
    for (const item of this.loot) {
      if (!item.taken && Math.hypot(thief.x - item.x, thief.y - item.y) < 34) {
        item.taken = true;
        this.score += item.value;
        events |= EVENT_LOOT;
        this.flash(`${item.label} pocketed (+$${item.value}).`);
      }
    }

    for (const smoke of this.smokes) smoke.timeLeft -= dt;
    this.smokes = this.smokes.filter((s) => s.timeLeft > 0);
    for (const coin of this.coinsThrown) coin.timeLeft -= dt;
    this.coinsThrown = this.coinsThrown.filter((c) => c.timeLeft > 0);
    if (this.messageLeft > 0) this.messageLeft -= dt;

    // Caught: the alarm maxes out, or a chasing guard touches the thief.
    const touched = this.guards.some((g) => g.state === 'chase' && Math.hypot(g.x - thief.x, g.y - thief.y) < 30);
    if (this.alarm >= 100 || touched) {
      this.over = true;
      this.won = false;
      return EVENT_CAUGHT;
    }

    // Win: diamond in hand and the thief reaches the getaway door.
    if (this.diamondTaken) {
      const exit = this.exit;
      if (thief.x >= exit.x - 10 && thief.x <= exit.x + exit.w + 10 && thief.y >= exit.y - 10 && thief.y <= exit.y + exit.h + 10) {
        this.over = true;
        this.won = true;
        const timeBonus = Math.max(0, Math.round((300 - this.time) * SCORE.secondBonus / 10));
        this.score += timeBonus;
        if (!this.everSpotted) this.score += SCORE.ghostBonus;
        this.timeBonus = timeBonus;
        this.ghost = !this.everSpotted;
        return EVENT_WIN;
      }
    }
    if (anySeen) events |= EVENT_SPOTTED;
    return events;
  }
}

export { STEP };
