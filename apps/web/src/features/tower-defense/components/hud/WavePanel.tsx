import type { ReactElement } from 'react'
import { ENEMIES } from '../../game/config/enemies'
import type { GameSnapshot, WavePreview } from '../../game/GameApp'
import { formatSeconds, hexColor } from '../formatters'
import css from '../styles.module.css'

interface WavePanelProps {
  snapshot: GameSnapshot
  onCallWave: () => void
}

export const EnemyChips = ({ preview }: { preview: WavePreview }): ReactElement => (
  <div className={css.enemyList}>
    {preview.enemies.map(({ enemy, count }) => {
      const def = ENEMIES[enemy]
      return (
        <span key={enemy} className={css.enemyChip} title={def.description}>
          <span className={css.enemyDot} style={{ background: hexColor(def.color), color: hexColor(def.color) }} />
          {def.name}
          <span className={css.enemyCount}>×{count}</span>
          {def.flying && <span className={`${css.tag} ${css.tagAir}`}>AIR</span>}
          {def.stealth && <span className={`${css.tag} ${css.tagStealth}`}>STEALTH</span>}
          {def.shieldHits && <span className={`${css.tag} ${css.tagShield}`}>SHIELD</span>}
          {def.boss && <span className={`${css.tag} ${css.tagBoss}`}>BOSS</span>}
        </span>
      )
    })}
  </div>
)

const WavePanel = ({ snapshot, onCallWave }: WavePanelProps): ReactElement => {
  const preview = snapshot.nextWave ?? snapshot.currentWave
  const isFinalRunning = snapshot.nextWave === null
  return (
    <div className={`${css.panel} ${css.wavePanel}`} data-testid="td-wave-panel">
      <div>
        <div className={css.panelKicker}>
          {isFinalRunning ? 'Final wave in progress' : `Incoming · wave ${preview?.index}`}
        </div>
        <div className={css.waveTitle}>{preview?.title}</div>
      </div>
      {preview && <div className={css.waveIntel}>{preview.intel}</div>}
      {preview && <EnemyChips preview={preview} />}
      {!isFinalRunning && (
        <div className={css.countdown}>
          <div>
            <div className={css.panelKicker}>{snapshot.wave === 0 ? 'Build phase' : 'Next wave in'}</div>
            <div className={css.countdownValue}>
              {snapshot.waveCountdown === null ? '—' : formatSeconds(snapshot.waveCountdown)}
            </div>
          </div>
          <button
            type="button"
            className={css.primaryButton}
            onClick={onCallWave}
            disabled={!snapshot.canCallWave}
            data-testid="td-call-wave"
          >
            {snapshot.wave === 0 ? 'Start defense' : 'Send wave'}
            <span className={css.kbd}>Space</span>
          </button>
        </div>
      )}
    </div>
  )
}

export default WavePanel
