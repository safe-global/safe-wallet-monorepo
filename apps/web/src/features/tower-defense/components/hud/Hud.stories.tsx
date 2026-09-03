import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'
import { makeSnapshot } from '../__fixtures__/snapshot'
import type { GameSnapshot } from '../../game/GameApp'
import BuildBar from './BuildBar'
import EndScreen from './EndScreen'
import Toast from './Toast'
import TopBar from './TopBar'
import TowerPanel from './TowerPanel'
import WavePanel from './WavePanel'
import css from '../styles.module.css'

const noop = (): void => {}

/** Composes the in-game HUD around a static snapshot so every panel can be reviewed without WebGL. */
const HudPreview = ({ snapshot }: { snapshot: GameSnapshot }): ReactElement => (
  <div className={css.root} style={{ position: 'relative', height: '100vh' }}>
    <div className={css.hud}>
      <TopBar
        snapshot={snapshot}
        onSpeed={noop}
        onPause={noop}
        onMute={noop}
        onBloom={noop}
        onHelp={noop}
        onExit={noop}
      />
      <WavePanel snapshot={snapshot} onCallWave={noop} />
      {snapshot.selected && (
        <TowerPanel selected={snapshot.selected} gold={snapshot.gold} onUpgrade={noop} onSell={noop} onClose={noop} />
      )}
      <BuildBar snapshot={snapshot} onSelect={noop} />
      <Toast toast={snapshot.toast} />
      {(snapshot.phase === 'won' || snapshot.phase === 'lost') && (
        <EndScreen snapshot={snapshot} isNewBest onRestart={noop} onMenu={noop} />
      )}
    </div>
  </div>
)

const meta = {
  title: 'Features/TowerDefense/Hud',
  component: HudPreview,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HudPreview>

export default meta
type Story = StoryObj<typeof meta>

export const BuildPhase: Story = { args: { snapshot: makeSnapshot() } }

export const WaveInProgress: Story = {
  args: {
    snapshot: makeSnapshot({
      phase: 'wave',
      wave: 10,
      enemiesAlive: 14,
      canCallWave: false,
      speed: 2,
      buildTowerId: 'safenet',
      toast: { id: 1, text: 'Wave 10: BOSS: Rug pull whale', tone: 'info' },
    }),
  },
}

export const TowerSelected: Story = {
  args: {
    snapshot: makeSnapshot({
      gold: 80,
      selected: {
        uid: 3,
        towerId: 'hypernative',
        level: 2,
        kills: 31,
        damageDealt: 8120,
        upgradeCost: 150,
        sellValue: 133,
        auraBonus: 1.28,
      },
    }),
  },
}

export const TreasuryLow: Story = {
  args: {
    snapshot: makeSnapshot({
      treasury: 3,
      gold: 12,
      paused: true,
      toast: { id: 2, text: '2 ETH drained from the treasury!', tone: 'danger' },
    }),
  },
}

export const Victory: Story = {
  args: { snapshot: makeSnapshot({ phase: 'won', wave: 30, treasury: 11, kills: 812, score: 48210, nextWave: null }) },
}

export const Defeat: Story = {
  args: { snapshot: makeSnapshot({ phase: 'lost', wave: 17, treasury: 0, kills: 301, score: 9020 }) },
}
