// Tiny synth: no audio files, just WebAudio oscillators. Created lazily on the
// first player input so browsers never block it, and silent in screenshots.
export function makeAudio() {
  let context = null;
  let muted = false;
  function ensure() {
    if (context || muted) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }
  function blip(frequency, seconds, type, gainValue) {
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(gainValue || 0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + seconds);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  }
  return {
    unlock() { ensure(); },
    get muted() { return muted; },
    toggleMute() { muted = !muted; return muted; },
    loot() { blip(880, 0.12, 'triangle', 0.06); setTimeout(() => blip(1320, 0.16, 'triangle', 0.06), 70); },
    crack() { blip(520, 0.08, 'square', 0.04); },
    alarm() { blip(220, 0.3, 'sawtooth', 0.05); setTimeout(() => blip(180, 0.3, 'sawtooth', 0.05), 160); },
    caught() { blip(160, 0.5, 'sawtooth', 0.07); setTimeout(() => blip(110, 0.7, 'sawtooth', 0.07), 220); },
    win() { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => blip(f, 0.22, 'triangle', 0.06), i * 110)); },
  };
}
