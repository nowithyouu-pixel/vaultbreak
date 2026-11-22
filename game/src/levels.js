// The three heists: rooms, walls, cover, patrols, cameras, loot and exits.
// Coordinates are canvas pixels (1280x720). Walls and crates block movement and
// sight; shadows are dark floor where guards spot you half as fast; the vault
// holds the diamond and needs a lockpick hold; the door is the getaway.
export const LEVELS = [
  {
    name: 'I — The Gallery',
    brief: 'Lift the Star Diamond from the gallery vault. Two guards, one camera.',
    start: { x: 90, y: 630 },
    exit: { x: 1210, y: 640, w: 56, h: 56, label: 'GETAWAY DOOR' },
    vault: { x: 1120, y: 90, w: 84, h: 64, label: 'VAULT' },
    walls: [
      { x: 0, y: 0, w: 1280, h: 18 }, { x: 0, y: 702, w: 1280, h: 18 },
      { x: 0, y: 0, w: 18, h: 720 }, { x: 1262, y: 0, w: 18, h: 720 },
      { x: 300, y: 0, w: 22, h: 300 },
      { x: 300, y: 420, w: 22, h: 300 },
      { x: 640, y: 180, w: 22, h: 360 },
      { x: 940, y: 0, w: 22, h: 240 },
      { x: 940, y: 380, w: 22, h: 340 },
    ],
    crates: [
      { x: 180, y: 480, w: 90, h: 60 },
      { x: 470, y: 560, w: 110, h: 56 },
      { x: 760, y: 90, w: 100, h: 56 },
      { x: 1060, y: 420, w: 96, h: 60 },
      { x: 560, y: 300, w: 60, h: 60 },
    ],
    shadows: [
      { x: 330, y: 560, w: 200, h: 110 },
      { x: 700, y: 480, w: 200, h: 120 },
      { x: 980, y: 180, w: 180, h: 120 },
    ],
    loot: [
      { kind: 'painting', x: 150, y: 120, value: 250, label: 'Portrait' },
      { kind: 'cash', x: 520, y: 120, value: 150, label: 'Cash box' },
      { kind: 'painting', x: 830, y: 620, value: 250, label: 'Landscape' },
    ],
    guards: [
      { waypoints: [{ x: 420, y: 180 }, { x: 420, y: 520 }, { x: 600, y: 520 }, { x: 600, y: 180 }], pause: 1.2 },
      { waypoints: [{ x: 820, y: 620 }, { x: 1100, y: 620 }, { x: 1100, y: 330 }, { x: 820, y: 330 }], pause: 0.8 },
    ],
    cameras: [
      { x: 662, y: 40, baseAngle: Math.PI / 2, sweep: 0.9, phase: 0 },
    ],
  },
  {
    name: 'II — The Vault Floor',
    brief: 'The vault floor: three guards, two cameras, and a long glass hall.',
    start: { x: 90, y: 90 },
    exit: { x: 90, y: 640, w: 56, h: 56, label: 'GETAWAY DOOR' },
    vault: { x: 1120, y: 580, w: 84, h: 64, label: 'VAULT' },
    walls: [
      { x: 0, y: 0, w: 1280, h: 18 }, { x: 0, y: 702, w: 1280, h: 18 },
      { x: 0, y: 0, w: 18, h: 720 }, { x: 1262, y: 0, w: 18, h: 720 },
      { x: 260, y: 180, w: 760, h: 22 },
      { x: 260, y: 500, w: 760, h: 22 },
      { x: 560, y: 202, w: 22, h: 298 },
      { x: 940, y: 202, w: 22, h: 120 },
      { x: 940, y: 400, w: 22, h: 100 },
    ],
    crates: [
      { x: 120, y: 300, w: 100, h: 56 },
      { x: 380, y: 560, w: 110, h: 56 },
      { x: 700, y: 560, w: 100, h: 56 },
      { x: 1080, y: 300, w: 96, h: 60 },
      { x: 700, y: 90, w: 110, h: 56 },
    ],
    shadows: [
      { x: 300, y: 240, w: 200, h: 110 },
      { x: 760, y: 560, w: 220, h: 100 },
      { x: 1040, y: 90, w: 180, h: 110 },
    ],
    loot: [
      { kind: 'cash', x: 180, y: 620, value: 150, label: 'Cash box' },
      { kind: 'painting', x: 430, y: 90, value: 250, label: 'Portrait' },
      { kind: 'cash', x: 1140, y: 120, value: 150, label: 'Cash box' },
      { kind: 'painting', x: 660, y: 330, value: 250, label: 'Still life' },
    ],
    guards: [
      { waypoints: [{ x: 180, y: 260 }, { x: 480, y: 260 }, { x: 480, y: 440 }, { x: 180, y: 440 }], pause: 1.0 },
      { waypoints: [{ x: 700, y: 260 }, { x: 980, y: 260 }, { x: 980, y: 440 }, { x: 700, y: 440 }], pause: 1.0 },
      { waypoints: [{ x: 1140, y: 220 }, { x: 1140, y: 620 }, { x: 700, y: 620 }], pause: 1.4 },
    ],
    cameras: [
      { x: 582, y: 40, baseAngle: Math.PI / 2, sweep: 1.0, phase: 0 },
      { x: 962, y: 690, baseAngle: -Math.PI / 2, sweep: 0.8, phase: 1.6 },
    ],
  },
  {
    name: 'III — The Rooftop',
    brief: 'Last job: the penthouse vault, tight patrols, one way out — the roof door.',
    start: { x: 640, y: 640 },
    exit: { x: 1210, y: 80, w: 56, h: 56, label: 'ROOF DOOR' },
    vault: { x: 120, y: 90, w: 84, h: 64, label: 'VAULT' },
    walls: [
      { x: 0, y: 0, w: 1280, h: 18 }, { x: 0, y: 702, w: 1280, h: 18 },
      { x: 0, y: 0, w: 18, h: 720 }, { x: 1262, y: 0, w: 18, h: 720 },
      { x: 420, y: 0, w: 22, h: 260 },
      { x: 420, y: 400, w: 22, h: 320 },
      { x: 840, y: 180, w: 22, h: 380 },
      { x: 840, y: 0, w: 22, h: 60 },
    ],
    crates: [
      { x: 200, y: 300, w: 110, h: 56 },
      { x: 560, y: 560, w: 100, h: 56 },
      { x: 980, y: 480, w: 110, h: 56 },
      { x: 980, y: 200, w: 96, h: 60 },
      { x: 560, y: 120, w: 100, h: 56 },
    ],
    shadows: [
      { x: 60, y: 380, w: 220, h: 120 },
      { x: 500, y: 280, w: 200, h: 110 },
      { x: 900, y: 560, w: 220, h: 100 },
    ],
    loot: [
      { kind: 'painting', x: 200, y: 90, value: 250, label: 'Portrait' },
      { kind: 'cash', x: 700, y: 90, value: 150, label: 'Cash box' },
      { kind: 'cash', x: 1150, y: 620, value: 150, label: 'Cash box' },
      { kind: 'painting', x: 1150, y: 300, value: 250, label: 'Seascape' },
    ],
    guards: [
      { waypoints: [{ x: 240, y: 220 }, { x: 240, y: 560 }, { x: 380, y: 560 }, { x: 380, y: 220 }], pause: 0.8 },
      { waypoints: [{ x: 640, y: 220 }, { x: 640, y: 560 }, { x: 800, y: 560 }, { x: 800, y: 220 }], pause: 0.8 },
      { waypoints: [{ x: 1040, y: 120 }, { x: 1040, y: 620 }, { x: 1180, y: 620 }], pause: 1.0 },
    ],
    cameras: [
      { x: 442, y: 690, baseAngle: -Math.PI / 2, sweep: 1.0, phase: 0 },
      { x: 862, y: 40, baseAngle: Math.PI / 2, sweep: 0.9, phase: 2.2 },
    ],
  },
];
