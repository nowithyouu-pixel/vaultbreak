// Canvas drawing for Vaultbreak: the room, the cones, the thief and the HUD.
// The look is deliberate: safe cover reads dark blue, danger reads amber/red,
// loot reads gold, so the whole heist is readable at a glance.
import { FIELD, GUARD, CAMERA, ALARM } from './config.js';
import { angleDiff } from './guards.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_WIN = 'win';
export const SCREEN_PAUSE = 'pause';

const GOLD = '#f5c542';
const DANGER = '#e5484d';
const WARN = '#f5a524';
const SAFE = '#3dd68c';
const INK = '#0b0d12';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, angle, halfAngle, distance, color) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, distance, angle - halfAngle, angle + halfAngle);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawFloor(ctx) {
  ctx.fillStyle = '#171a21';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.strokeStyle = 'rgba(255,255,255,0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= FIELD.width; x += 64) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FIELD.height); ctx.stroke();
  }
  for (let y = 0; y <= FIELD.height; y += 64) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FIELD.width, y); ctx.stroke();
  }
  // A worn rug down the middle of the gallery, purely for orientation.
  ctx.fillStyle = 'rgba(120,40,60,0.16)';
  ctx.fillRect(330, 330, 620, 60);
}

function drawRoom(ctx, world) {
  const level = world.level;
  for (const s of level.shadows) {
    ctx.fillStyle = 'rgba(20,30,70,0.55)';
    roundRect(ctx, s.x, s.y, s.w, s.h, 14);
    ctx.fill();
    ctx.fillStyle = 'rgba(140,170,255,0.25)';
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText('SHADOW — hard to spot here', s.x + 10, s.y + 18);
  }
  for (const wall of level.walls) {
    ctx.fillStyle = '#2a2f3d';
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.fillStyle = '#3a4152';
    ctx.fillRect(wall.x, wall.y, wall.w, 3);
  }
  for (const crate of level.crates) {
    ctx.fillStyle = '#4a3b22';
    roundRect(ctx, crate.x, crate.y, crate.w, crate.h, 6);
    ctx.fill();
    ctx.strokeStyle = '#6b5636';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(crate.x + 8, crate.y + 8); ctx.lineTo(crate.x + crate.w - 8, crate.y + crate.h - 8);
    ctx.moveTo(crate.x + crate.w - 8, crate.y + 8); ctx.lineTo(crate.x + 8, crate.y + crate.h - 8);
    ctx.stroke();
  }
  // Vault: a steel door with a gold diamond behind it once cracked.
  const v = world.vault;
  ctx.fillStyle = world.vaultOpen ? '#5a4a12' : '#39415a';
  roundRect(ctx, v.x, v.y, v.w, v.h, 8);
  ctx.fill();
  ctx.strokeStyle = world.vaultOpen ? GOLD : '#7a86a8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(world.vaultOpen ? '◆ OPEN' : 'VAULT', v.x + v.w / 2, v.y + v.h / 2 - 4);
  ctx.fillText(world.vaultOpen ? '' : 'hold E', v.x + v.w / 2, v.y + v.h / 2 + 14);
  ctx.textAlign = 'left';
  // Getaway door.
  const e = world.exit;
  ctx.fillStyle = world.diamondTaken ? SAFE : '#2c4a34';
  roundRect(ctx, e.x, e.y, e.w, e.h, 8);
  ctx.fill();
  ctx.strokeStyle = world.diamondTaken ? '#b8ffce' : '#5a7a63';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#0b0d12';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 4);
  ctx.textAlign = 'left';
  // Loot.
  for (const item of world.loot) {
    if (item.taken) continue;
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.kind === 'painting' ? 12 : 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0b0d12';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(item.kind === 'painting' ? '▣' : '$', item.x, item.y + 4);
    ctx.textAlign = 'left';
  }
}

function drawCones(ctx, world) {
  for (const camera of world.cameras) {
    const hot = camera.suspicion > ALARM.hotSuspicion;
    drawCone(ctx, camera.x, camera.y, camera.angle, CAMERA.viewHalfAngle, CAMERA.viewDistance,
      hot ? 'rgba(229,72,77,0.30)' : 'rgba(245,165,36,0.20)');
  }
  for (const guard of world.guards) {
    const hot = guard.suspicion > ALARM.hotSuspicion;
    const chasing = guard.state === 'chase';
    drawCone(ctx, guard.x, guard.y, guard.facing, GUARD.viewHalfAngle, GUARD.viewDistance,
      chasing ? 'rgba(229,72,77,0.34)' : hot ? 'rgba(245,165,36,0.26)' : 'rgba(245,196,66,0.15)');
  }
}

function drawActors(ctx, world) {
  for (const camera of world.cameras) {
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = camera.suspicion > ALARM.hotSuspicion ? DANGER : WARN;
    ctx.beginPath(); ctx.arc(camera.x, camera.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(camera.x, camera.y);
    ctx.lineTo(camera.x + Math.cos(camera.angle) * 20, camera.y + Math.sin(camera.angle) * 20); ctx.stroke();
  }
  for (const smoke of world.smokes) {
    ctx.fillStyle = 'rgba(200,200,210,0.35)';
    ctx.beginPath(); ctx.arc(smoke.x, smoke.y, smoke.r, 0, Math.PI * 2); ctx.fill();
  }
  for (const coin of world.coinsThrown) {
    ctx.fillStyle = GOLD;
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(245,197,66,0.8)';
    ctx.beginPath(); ctx.arc(coin.x, coin.y, 12, 0, Math.PI * 2); ctx.stroke();
  }
  for (const guard of world.guards) {
    ctx.fillStyle = guard.state === 'chase' ? DANGER : '#3a5a8c';
    ctx.beginPath(); ctx.arc(guard.x, guard.y, GUARD.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#dbe4ff';
    ctx.beginPath(); ctx.arc(guard.x, guard.y, 5, 0, Math.PI * 2); ctx.fill();
    // Facing tick.
    ctx.strokeStyle = '#dbe4ff';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(guard.x, guard.y);
    ctx.lineTo(guard.x + Math.cos(guard.facing) * 20, guard.y + Math.sin(guard.facing) * 20); ctx.stroke();
    if (guard.suspicion > 0.08) {
      ctx.fillStyle = guard.suspicion > ALARM.hotSuspicion ? DANGER : WARN;
      ctx.font = 'bold 22px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.state === 'chase' ? '!' : '?', guard.x, guard.y - 24);
      ctx.textAlign = 'left';
      // Suspicion bar.
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(guard.x - 16, guard.y - 20, 32, 4);
      ctx.fillStyle = guard.suspicion > ALARM.hotSuspicion ? DANGER : WARN;
      ctx.fillRect(guard.x - 16, guard.y - 20, 32 * guard.suspicion, 4);
    }
    if (guard.state === 'investigate' && guard.investigate) {
      ctx.strokeStyle = 'rgba(245,165,36,0.7)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(guard.x, guard.y); ctx.lineTo(guard.investigate.x, guard.investigate.y); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  // The thief: a hooded figure, gold-trimmed, with a crack-progress ring.
  const t = world.thief;
  ctx.fillStyle = t.sneaking ? '#1f6f4a' : '#2f7a52';
  ctx.beginPath(); ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0b0d12';
  ctx.beginPath(); ctx.arc(t.x + Math.cos(t.facing) * 5, t.y + Math.sin(t.facing) * 5, 5, 0, Math.PI * 2); ctx.fill();
  if (t.cracking) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.radius + 7, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * t.crackProgress);
    ctx.stroke();
  }
}

function drawHud(ctx, world) {
  // Top bar: title, alarm meter, score, loot, tools — each in its own lane.
  ctx.fillStyle = 'rgba(5,6,9,0.82)';
  ctx.fillRect(0, 0, FIELD.width, 52);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`VAULTBREAK  ·  ${world.level.name}`, 16, 22);
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillStyle = '#9aa4b5';
  ctx.fillText(world.level.brief, 16, 42);
  // Alarm meter.
  const ax = 480;
  ctx.fillStyle = '#9aa4b5';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#262b38';
  roundRect(ctx, ax, 26, 180, 12, 6); ctx.fill();
  const alarmColor = world.alarm > 70 ? DANGER : world.alarm > 35 ? WARN : SAFE;
  ctx.fillStyle = alarmColor;
  roundRect(ctx, ax, 26, 180 * (world.alarm / 100), 12, 6); ctx.fill();
  // Score and loot.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`$${world.score.toLocaleString()}`, 700, 24);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '12px system-ui, sans-serif';
  const lootLeft = world.loot.filter((i) => !i.taken).length;
  ctx.fillText(`Loot ${world.loot.length - lootLeft}/${world.loot.length}  ·  ◆ ${world.diamondTaken ? 'TAKEN' : 'in vault'}`, 700, 43);
  ctx.fillText(`Coins ${world.thief.coins} (C/click)  ·  Smoke ${world.thief.smokes} (X)  ·  ${Math.floor(world.time)}s`, 940, 24);
  ctx.fillStyle = '#9aa4b5';
  ctx.fillText('WASD move · Shift sneak · E crack · P pause', 940, 43);
  if (world.messageLeft > 0) {
    ctx.fillStyle = 'rgba(5,6,9,0.8)';
    const w = ctx.measureText(world.message).width + 28;
    roundRect(ctx, (FIELD.width - w) / 2, 62, w, 30, 8); ctx.fill();
    ctx.fillStyle = world.message.startsWith('ALARM') ? DANGER : GOLD;
    ctx.font = 'bold 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(world.message, FIELD.width / 2, 82);
    ctx.textAlign = 'left';
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5,6,9,0.78)';
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  ctx.fillStyle = accent || GOLD;
  ctx.font = 'bold 64px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, FIELD.width / 2, 250);
  ctx.fillStyle = '#e8ecf4';
  ctx.font = '20px system-ui, sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, FIELD.width / 2, 310 + i * 34));
  ctx.textAlign = 'left';
}

export function render(ctx, world, screen, best) {
  ctx.clearRect(0, 0, FIELD.width, FIELD.height);
  if (screen === SCREEN_TITLE) {
    drawFloor(ctx);
    drawRoom(ctx, world);
    drawCones(ctx, world);
    drawActors(ctx, world);
    drawOverlay(ctx, 'VAULTBREAK', [
      'A midnight heist in three rooms. Sneak past the guards,',
      'mind the cameras, crack the vault and reach the getaway door.',
      '',
      'WASD / arrows — move    Shift — sneak    E — crack the vault',
      'C or click — toss a coin    X — smoke bomb    P — pause',
      '',
      'Press Enter or click to start the first heist.',
    ], GOLD);
    return;
  }
  drawFloor(ctx);
  drawRoom(ctx, world);
  drawCones(ctx, world);
  drawActors(ctx, world);
  drawHud(ctx, world);
  if (screen === SCREEN_OVER) {
    drawOverlay(ctx, 'BUSTED', [
      `The alarm hit 100 — the crew scattered. Score $${world.score.toLocaleString()}.`,
      'The guards were fair: every cone you saw was every cone there was.',
      '',
      'Press R to run this room again, or Enter for the title screen.',
    ], DANGER);
  } else if (screen === SCREEN_WIN) {
    const lines = world.levelIndex + 1 >= 3
      ? [
        `All three vaults cracked. Final take $${world.score.toLocaleString()}.`,
        world.ghost ? 'GHOST — never spotted once. The perfect crew.' : 'Spotted along the way, but the diamond still came home.',
        '',
        'Press Enter to play it all again.',
      ]
      : [
        `Room cleared — take $${world.score.toLocaleString()} so far.`,
        world.ghost ? 'GHOST bonus +$500 — nobody ever saw you.' : 'You were spotted, but the job is done.',
        '',
        'Press Enter for the next room.',
      ];
    drawOverlay(ctx, world.levelIndex + 1 >= 3 ? 'CLEAN GETAWAY' : 'GETAWAY!', lines, SAFE);
  } else if (screen === SCREEN_PAUSE) {
    drawOverlay(ctx, 'PAUSED', ['The crew waits in the dark.', '', 'Press P to keep moving.'], '#9aa4b5');
  }
}

export { angleDiff };
