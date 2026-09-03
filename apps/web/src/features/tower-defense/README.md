# Safe{Defense}

A Warcraft-3-style 3D tower defense game where Safe security primitives defend the treasury
against everyone who ever tried to drain a Safe. Reachable at `/tower-defense` (not linked
from navigation). Everything, three.js included, is code-split behind `next/dynamic` and only
loads on that route.

## Layout

```
game/
  config/     towers, enemies, waves, map, difficulty, damage table  (pure data)
  sim/        Simulation.ts – deterministic fixed-step simulation, emits SimEvents
  render/     three.js scene, procedural tower/enemy models, effects, RTS camera
  audio/      SoundEngine.ts – procedural Web Audio SFX and adaptive music
  GameApp.ts  loop + input + external store consumed by the React HUD
components/
  TowerDefensePage.tsx  start screen → GameView
  GameView.tsx          mounts the GameApp into a container and renders the HUD
  hud/                  TopBar, WavePanel, BuildBar, TowerPanel, StartScreen, EndScreen, HelpOverlay
```

The simulation knows nothing about rendering and is fully unit tested; the renderer and the
sound engine only react to the events it emits. `GameController` is the narrow interface the
HUD talks to, so component tests inject a fake instead of WebGL.

## Tuning

Balance lives entirely in `game/config`. Enemy HP scales with `waveHpMultiplier` in
`waves.ts`; economy knobs are bounties (`enemies.ts`), tower costs (`towers.ts`), the wave clear
bonus in `Simulation.clearWave` and the per-difficulty values in `difficulty.ts`.
