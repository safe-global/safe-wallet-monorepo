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
  volume: 0.8,
  bloom: true,
  endless: false,
  buildTowerId: null,
  selected: null,
  nextWave: preview(4),
  currentWave: preview(3),
  waveProgress: null,
  abilities: {
    hardFork: { available: false, used: false, threshold: 0.3 },
    fundraise: { available: true, round: 'Seed', eth: 3, cost: 90, cooldown: 0 },
    nuke: { available: false, cooldown: 84, inFlight: false },
  },
  toast: null,
  icons: Object.fromEntries(Object.keys(TOWERS).map((id) => [id, ''])) as Record<TowerId, string>,
  elapsed: 184,
  ...overrides,
})
