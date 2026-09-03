import type { ReactElement } from 'react'
import { DIFFICULTIES } from '../../game/config/difficulty'
import type { GameSnapshot } from '../../game/GameApp'
import { formatDuration, formatNumber } from '../formatters'
import css from '../styles.module.css'

interface EndScreenProps {
  snapshot: GameSnapshot
  isNewBest: boolean
  onRestart: () => void
  onMenu: () => void
  onContinueEndless?: () => void
}

const EndScreen = ({ snapshot, isNewBest, onRestart, onMenu, onContinueEndless }: EndScreenProps): ReactElement => {
  const won = snapshot.phase === 'won'
  return (
    <div className={css.overlay} data-testid="td-end-screen">
      <div className={`${css.panel} ${css.overlayCard}`}>
        <div>
          <div className={`${css.title} ${won ? css.won : css.lost}`}>{won ? 'Treasury secured' : 'Safe drained'}</div>
          <div className={css.subtitle}>
            {won
              ? `Every attacker was neutralised on ${DIFFICULTIES[snapshot.difficulty].name}. The signers can sleep.`
              : `The attackers emptied the vault during wave ${snapshot.wave} on ${DIFFICULTIES[snapshot.difficulty].name}.`}
          </div>
        </div>
        <div className={css.endStats}>
          <div className={css.endStat}>
            <div className={css.statCellLabel}>Score</div>
            <div className={css.endStatValue}>{snapshot.score.toLocaleString('en-US')}</div>
            {isNewBest && <div className={css.newBest}>New personal best</div>}
          </div>
          <div className={css.endStat}>
            <div className={css.statCellLabel}>Waves survived</div>
            <div className={css.endStatValue}>
              {won ? snapshot.totalWaves : Math.max(0, snapshot.wave - 1)}
              {Number.isFinite(snapshot.totalWaves) ? `/${snapshot.totalWaves}` : ''}
            </div>
          </div>
          <div className={css.endStat}>
            <div className={css.statCellLabel}>Threats neutralised</div>
            <div className={css.endStatValue}>{formatNumber(snapshot.kills)}</div>
          </div>
          <div className={css.endStat}>
            <div className={css.statCellLabel}>ETH remaining</div>
            <div className={css.endStatValue}>{snapshot.treasury}</div>
          </div>
          <div className={css.endStat}>
            <div className={css.statCellLabel}>Leaks</div>
            <div className={css.endStatValue}>{snapshot.leaked}</div>
          </div>
          <div className={css.endStat}>
            <div className={css.statCellLabel}>Time</div>
            <div className={css.endStatValue}>{formatDuration(snapshot.elapsed)}</div>
          </div>
        </div>
        <div className={css.startRow}>
          {won && onContinueEndless && (
            <button type="button" className={css.primaryButton} onClick={onContinueEndless} data-testid="td-endless">
              Continue in endless mode
            </button>
          )}
          <button
            type="button"
            className={won && onContinueEndless ? css.secondaryButton : css.primaryButton}
            onClick={onRestart}
            data-testid="td-restart"
          >
            Play again
          </button>
          <button type="button" className={css.secondaryButton} onClick={onMenu}>
            Back to menu
          </button>
        </div>
      </div>
    </div>
  )
}

export default EndScreen
