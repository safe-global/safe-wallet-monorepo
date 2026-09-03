import type { TargetingMode, TowerId } from './config/types'
import type { GameSnapshot, GameSpeed } from './GameApp'

/** The slice of GameApp the React HUD talks to. Kept as an interface so tests can inject a fake. */
export interface GameController {
  subscribe(listener: () => void): () => void
  getSnapshot(): GameSnapshot
  setBuildTower(id: TowerId | null): void
  selectTower(uid: number | null): void
  upgradeSelected(): void
  sellSelected(): void
  callNextWave(): void
  setSpeed(speed: GameSpeed): void
  togglePause(): void
  toggleMute(): void
  toggleBloom(): void
  setTargeting(mode: TargetingMode): void
  continueEndless(): void
  cancel(): void
  dispose(): void
}
