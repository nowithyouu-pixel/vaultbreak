// Shared numbers for Vaultbreak: field size, movement, sight and alarm tuning.
// Nothing here knows about drawing or input; levels.js builds rooms from these.
export const FIELD = { width: 1280, height: 720 };
export const STEP = 1 / 60;

export const THIEF = {
  radius: 13,
  walkSpeed: 170,
  sneakSpeed: 95,
  // Running is loud: guards hear it from this far away.
  noiseRadius: 150,
  sneakNoiseRadius: 45,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 62,
  chaseSpeed: 132,
  viewDistance: 235,
  // Half-angle of the vision cone, in radians.
  viewHalfAngle: 0.52,
  // Suspicion (0..1) gained per second while the thief is clearly in the cone.
  spotRate: 0.6,
  // Suspicion gained per second at the cone's edge or far away.
  edgeRate: 0.22,
  decayRate: 0.22,
  // Seconds a guard keeps chasing / investigating after losing sight.
  memorySeconds: 2.5,
};

export const CAMERA = {
  viewDistance: 250,
  viewHalfAngle: 0.42,
  spotRate: 0.8,
  // Degrees per second the camera sweeps.
  sweepSpeed: 34,
};

export const ALARM = {
  // Alarm (0..100) gained per second while any suspicion is full.
  riseRate: 20,
  decayRate: 2.5,
  // Suspicion above this starts raising the alarm.
  hotSuspicion: 0.55,
};

export const TOOLS = {
  coins: 3,
  smokes: 2,
  coinLureRadius: 190,
  smokeSeconds: 3.5,
  smokeRadius: 95,
  // Seconds of holding E beside the vault to crack it.
  crackSeconds: 2.4,
};

export const SCORE = {
  painting: 250,
  cash: 150,
  diamond: 1000,
  ghostBonus: 500,
  secondBonus: 12,
};
