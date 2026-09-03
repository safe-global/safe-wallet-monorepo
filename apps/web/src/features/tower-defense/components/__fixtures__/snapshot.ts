import { TOWERS } from '../../game/config/towers'
import type { TowerId } from '../../game/config/types'
import { getWave, TOTAL_WAVES, waveEnemyCounts } from '../../game/config/waves'
import type { GameSnapshot, WavePreview } from '../../game/GameApp'

const preview = (index: number): WavePreview | null => {
  const wave = getWave(index)
  return wave ? { index: wave.index, title: wave.title, intel: wave.intel, enemies: waveEnemyCounts(wave) } : null
}

export const makeSnapshot = (overrides: Partial<GameSnapshot> = {}): GameSnapshot => ({
  phase: 'building',
  difficulty: 'mainnet',
  wave: 3,
  totalWaves: TOTAL_WAVES,
  waveCountdown: 17.4,
  canCallWave: true,
  gold: 245,
  treasury: 18,
  maxTreasury: 20,
  kills: 42,
  leaked: 2,
  score: 1234,
  enemiesAlive: 0,
  speed: 1,
  paused: false,
  muted: false,
  bloom: true,
  endless: false,
  buildTowerId: null,
  selected: null,
  nextWave: preview(4),
  currentWave: preview(3),
  toast: null,
  icons: Object.fromEntries(Object.keys(TOWERS).map((id) => [id, ''])) as Record<TowerId, string>,
  elapsed: 184,
  ...overrides,
})
