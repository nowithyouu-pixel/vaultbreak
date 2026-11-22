# Vaultbreak

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/nowithyouu-pixel/vaultbreak/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/nowithyouu-pixel/vaultbreak/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

**Vaultbreak** is a top-down stealth heist game: three rooms, one thief, and a
lot of people paid to stop him. Read the guards' patrols and vision cones,
slip through the shadows, toss coins to pull a patrol off its route, drop
smoke when a camera sweeps your way, hold **E** to crack the vault, grab the
Star Diamond — and whatever else fits in your pockets — then reach the
getaway door before the alarm meter maxes out.

## Play it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: plain static files under `game/`, desktop Chrome.

## Controls

- **WASD / arrows** — move (running is loud; guards hear it)
- **Shift** — sneak (slower, quieter, harder to spot)
- **E** (hold) — crack the vault
- **C or click** — toss a coin to lure a guard (3 per room)
- **X** — smoke bomb, blocks every cone (2 per room)
- **P** — pause · **R** — restart the room · **M** — mute

## The job

1. **The Gallery** — two guards, one camera, the Star Diamond upstairs.
2. **The Vault Floor** — three guards, two cameras, a long glass hall.
3. **The Rooftop** — tight patrols, one way out: the roof door.

Score comes from loot, a time bonus, and a **GHOST bonus (+$500)** for
finishing a room without ever being spotted. Get caught and the crew scatters.

## How it is built

One clear job per file under `game/src/`: `levels.js` (the three rooms),
`guards.js` (patrols, cones, line of sight), `thief.js` (movement and tools),
`world.js` (alarm, loot, win/lose), `render.js` (the whole look), `input.js`,
`audio.js` (a tiny synth, no audio files), `shots.js` (the autopilot that
stages the screenshots by playing the real rules). `main.ts` hands the game
to make.fun's grader; `screenshots/` holds four frames taken from the game
itself in headless Chrome.

---

<sub>Entered on [make.fun](https://make.fun/?ref=nowithyou&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
