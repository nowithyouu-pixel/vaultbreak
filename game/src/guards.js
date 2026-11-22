// Guards and cameras: patrols, vision cones, line of sight and suspicion.
// A guard that fully spots the thief raises the alarm; one that only glimpses
// him walks over to investigate. Cameras never move, they only sweep and spot.
import { GUARD, CAMERA, FIELD } from './config.js';

export function angleTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// True when the segment a->b crosses the rectangle (walls and crates block sight).
export function segmentHitsRect(a, b, rect) {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  if (maxX < rect.x || minX > rect.x + rect.w || maxY < rect.y || minY > rect.y + rect.h) return false;
  if (pointInRect(a, rect) || pointInRect(b, rect)) return true;
  const corners = [
    { x: rect.x, y: rect.y }, { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h }, { x: rect.x, y: rect.y + rect.h },
  ];
  for (let i = 0; i < 4; i += 1) {
    if (segmentsCross(a, b, corners[i], corners[(i + 1) % 4])) return true;
  }
  return false;
}

function pointInRect(p, rect) {
  return p.x >= rect.x && p.x <= rect.x + rect.w && p.y >= rect.y && p.y <= rect.y + rect.h;
}

function segmentsCross(a, b, c, d) {
  const d1 = cross(d, c, a);
  const d2 = cross(d, c, b);
  const d3 = cross(b, a, c);
  const d4 = cross(b, a, d);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function cross(o, a, b) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

// Sight is blocked by walls, crates and smoke clouds.
export function hasLineOfSight(from, to, blockers, smokes) {
  for (const rect of blockers) {
    if (segmentHitsRect(from, to, rect)) return false;
  }
  for (const smoke of smokes) {
    if (smoke.timeLeft > 0 && segmentHitsRect(from, to, { x: smoke.x - smoke.r, y: smoke.y - smoke.r, w: smoke.r * 2, h: smoke.r * 2 })) return false;
  }
  return true;
}

export function makeGuard(def) {
  const start = def.waypoints[0];
  return {
    x: start.x, y: start.y,
    waypoints: def.waypoints,
    targetIndex: 1 % def.waypoints.length,
    pause: def.pause || 1,
    pauseLeft: 0,
    facing: 0,
    suspicion: 0,
    state: 'patrol', // patrol | investigate | chase
    investigate: null,
    memoryLeft: 0,
    alertFlash: 0,
  };
}

export function makeCamera(def) {
  return { x: def.x, y: def.y, baseAngle: def.baseAngle, sweep: def.sweep, phase: def.phase || 0, angle: def.baseAngle, suspicion: 0, time: 0 };
}

// Move one guard a step. Returns 'spotted' while the thief is in its cone.
export function stepGuard(guard, dt, world) {
  const thief = world.thief;
  const blockers = world.blockers;
  const speed = guard.state === 'chase' ? GUARD.chaseSpeed : GUARD.patrolSpeed;

  if (guard.state === 'patrol') {
    const target = guard.waypoints[guard.targetIndex];
    if (guard.pauseLeft > 0) {
      guard.pauseLeft -= dt;
    } else {
      const dx = target.x - guard.x;
      const dy = target.y - guard.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 4) {
        guard.targetIndex = (guard.targetIndex + 1) % guard.waypoints.length;
        guard.pauseLeft = guard.pause;
      } else {
        guard.facing = Math.atan2(dy, dx);
        guard.x += (dx / dist) * speed * dt;
        guard.y += (dy / dist) * speed * dt;
      }
    }
  } else {
    const target = guard.state === 'chase' ? thief : guard.investigate;
    const dx = target.x - guard.x;
    const dy = target.y - guard.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 6) {
      guard.facing = Math.atan2(dy, dx);
      guard.x += (dx / dist) * speed * dt;
      guard.y += (dy / dist) * speed * dt;
    }
    guard.memoryLeft -= dt;
    if (guard.memoryLeft <= 0) {
      guard.state = 'patrol';
      guard.investigate = null;
    }
  }

  // Vision: in range, inside the cone, line of sight, and not hidden in shadow.
  const dist = distance(guard, thief);
  let seen = 0;
  if (dist < GUARD.viewDistance && !thief.hidden) {
    const inCone = Math.abs(angleDiff(angleTo(guard, thief), guard.facing)) < GUARD.viewHalfAngle;
    if (inCone && hasLineOfSight(guard, thief, blockers, world.smokes)) {
      const closeness = 1 - dist / GUARD.viewDistance;
      const edge = Math.abs(angleDiff(angleTo(guard, thief), guard.facing)) / GUARD.viewHalfAngle;
      seen = (edge > 0.7 ? GUARD.edgeRate : GUARD.spotRate) * (0.5 + closeness);
      if (world.inShadow(thief)) seen *= 0.5;
      if (thief.sneaking) seen *= 0.6;
    }
  }
  if (seen > 0) {
    guard.suspicion = Math.min(1, guard.suspicion + seen * dt);
    if (guard.suspicion >= 1 && guard.state !== 'chase') {
      guard.state = 'chase';
      guard.memoryLeft = GUARD.memorySeconds;
      guard.alertFlash = 1;
    } else if (guard.suspicion > 0.55 && guard.state === 'patrol') {
      guard.state = 'investigate';
      guard.investigate = { x: thief.x, y: thief.y };
      guard.memoryLeft = GUARD.memorySeconds;
    }
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - GUARD.decayRate * dt);
  }
  guard.alertFlash = Math.max(0, guard.alertFlash - dt);
  return seen > 0;
}

export function stepCamera(camera, dt, world) {
  camera.time += dt;
  camera.angle = camera.baseAngle + Math.sin(camera.time * (CAMERA.sweepSpeed * Math.PI / 180) + camera.phase) * camera.sweep;
  const thief = world.thief;
  const dist = distance(camera, thief);
  let seen = 0;
  if (dist < CAMERA.viewDistance && !thief.hidden) {
    const inCone = Math.abs(angleDiff(angleTo(camera, thief), camera.angle)) < CAMERA.viewHalfAngle;
    if (inCone && hasLineOfSight(camera, thief, world.blockers, world.smokes)) {
      seen = CAMERA.spotRate * (0.5 + (1 - dist / CAMERA.viewDistance));
      if (world.inShadow(thief)) seen *= 0.5;
      if (thief.sneaking) seen *= 0.6;
    }
  }
  camera.suspicion = seen > 0
    ? Math.min(1, camera.suspicion + seen * dt)
    : Math.max(0, camera.suspicion - GUARD.decayRate * dt);
  return seen > 0;
}

// A noise at (x, y) pulls every guard inside its radius over to look.
export function alertGuardsToNoise(guards, x, y, radius) {
  for (const guard of guards) {
    if (distance(guard, { x, y }) < radius && guard.state === 'patrol') {
      guard.state = 'investigate';
      guard.investigate = { x, y };
      guard.memoryLeft = GUARD.memorySeconds + 1;
    }
  }
}

export { FIELD };
