// Keyboard and mouse input, kept as a plain object the world steps with.
// WASD or arrows move, Shift sneaks, E cracks the vault, C or click tosses a
// coin at the cursor, X drops smoke, P pauses, M mutes, R restarts a level.
export function makeInput() {
  return {
    up: false, down: false, left: false, right: false,
    sneak: false, interact: false,
    coin: false, coinX: 0, coinY: 0,
    smoke: false,
  };
}

const KEY_MAP = {
  KeyW: 'up', ArrowUp: 'up',
  KeyS: 'down', ArrowDown: 'down',
  KeyA: 'left', ArrowLeft: 'left',
  KeyD: 'right', ArrowRight: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyE: 'interact',
};

export function attachInput(input, canvas, hooks) {
  const down = (event) => {
    const field = KEY_MAP[event.code];
    if (field) {
      input[field] = true;
      event.preventDefault();
    }
    if (event.code === 'KeyC') {
      const rect = canvas.getBoundingClientRect();
      input.coin = true;
      input.coinX = (event.clientX - rect.left) * (canvas.width / rect.width);
      input.coinY = (event.clientY - rect.top) * (canvas.height / rect.height);
    }
    if (event.code === 'KeyX') input.smoke = true;
    if (event.code === 'KeyP') hooks.onPause();
    if (event.code === 'KeyM') hooks.onMute();
    if (event.code === 'KeyR') hooks.onRestart();
    if (event.code === 'Enter' || event.code === 'Space') hooks.onConfirm();
  };
  const up = (event) => {
    const field = KEY_MAP[event.code];
    if (field) input[field] = false;
  };
  const click = (event) => {
    const rect = canvas.getBoundingClientRect();
    input.coin = true;
    input.coinX = (event.clientX - rect.left) * (canvas.width / rect.width);
    input.coinY = (event.clientY - rect.top) * (canvas.height / rect.height);
    hooks.onConfirm();
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  canvas.addEventListener('mousedown', click);
  return () => {
    window.removeEventListener('keydown', down);
    window.removeEventListener('keyup', up);
    canvas.removeEventListener('mousedown', click);
  };
}

// One-shot flags (coin, smoke) are consumed after the world reads them.
export function consumeOneShots(input) {
  input.coin = false;
  input.smoke = false;
}
