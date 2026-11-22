// Deterministic RNG (mulberry32) so a seed always replays the same heist.
// The screenshot autopilot and the level jitter both draw from it.
export function makeRandom(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick(random, list) {
  return list[Math.floor(random() * list.length)];
}
