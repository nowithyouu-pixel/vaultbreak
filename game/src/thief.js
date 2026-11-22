// The thief: WASD/arrows to move, Shift to sneak, E to crack the vault,
// C or click to toss a coin, X for a smoke bomb. Movement collides with walls
// and crates; running is loud enough for guards to hear.
import { THIEF, TOOLS } from './config.js';

export function makeThief(start) {
  return {
    x: start.x, y: start.y,
    radius: THIEF.radius,
    sneaking: false,
    moving: false,
    facing: -Math.PI / 2,
    hidden: false,
    coins: TOOLS.coins,
    smokes: TOOLS.smokes,
    crackProgress: 0,
    cracking: false,
  };
}

// Push a circle out of every rectangle it overlaps (walls and crates).
export function collideCircle(pos, radius, rects) {
  for (const rect of rects) {
    const nearX = Math.max(rect.x, Math.min(pos.x, rect.x + rect.w));
    const nearY = Math.max(rect.y, Math.min(pos.y, rect.y + rect.h));
    const dx = pos.x - nearX;
    const dy = pos.y - nearY;
    const distSq = dx * dx + dy * dy;
    if (distSq < radius * radius) {
      if (distSq === 0) {
        pos.y = rect.y - radius;
      } else {
        const dist = Math.sqrt(distSq);
        pos.x += (dx / dist) * (radius - dist);
        pos.y += (dy / dist) * (radius - dist);
      }
    }
  }
}

export function stepThief(thief, input, dt, world) {
  const speed = input.sneak ? THIEF.sneakSpeed : THIEF.walkSpeed;
  thief.sneaking = input.sneak;
  const dx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const dy = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  thief.moving = dx !== 0 || dy !== 0;
  if (thief.moving) {
    const len = Math.hypot(dx, dy);
    thief.x += (dx / len) * speed * dt;
    thief.y += (dy / len) * speed * dt;
    thief.facing = Math.atan2(dy, dx);
    collideCircle(thief, thief.radius, world.solids);
    thief.x = Math.max(thief.radius, Math.min(world.field.width - thief.radius, thief.x));
    thief.y = Math.max(thief.radius, Math.min(world.field.height - thief.radius, thief.y));
    // Running makes noise; sneaking barely does.
    const noise = input.sneak ? THIEF.sneakNoiseRadius : THIEF.noiseRadius;
    world.noise = { x: thief.x, y: thief.y, radius: noise, timeLeft: 0.25 };
  } else {
    world.noise = null;
  }

  // Vault cracking: hold E beside the vault.
  const nearVault = Math.hypot(thief.x - world.vaultCentre.x, thief.y - world.vaultCentre.y) < 95;
  thief.cracking = Boolean(input.interact && nearVault && !world.vaultOpen);
  if (thief.cracking) {
    thief.crackProgress += dt / TOOLS.crackSeconds;
    if (thief.crackProgress >= 1) {
      world.vaultOpen = true;
      world.onVaultOpened();
    }
  } else {
    thief.crackProgress = Math.max(0, thief.crackProgress - dt * 0.5);
  }
  return nearVault;
}
