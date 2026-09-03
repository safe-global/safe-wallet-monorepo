import type { ReactElement } from 'react'
import type { GameSnapshot, GameSpeed } from '../../game/GameApp'
import { formatNumber } from '../formatters'
import css from '../styles.module.css'

interface TopBarProps {
  snapshot: GameSnapshot
  onSpeed: (speed: GameSpeed) => void
  onPause: () => void
  onMute: () => void
  onBloom: () => void
  onHelp: () => void
  onExit: () => void
}

const SPEEDS: GameSpeed[] = [1, 2, 3]

const TopBar = ({ snapshot, onSpeed, onPause, onMute, onBloom, onHelp, onExit }: TopBarProps): ReactElement => {
  const treasuryRatio = snapshot.maxTreasury > 0 ? snapshot.treasury / snapshot.maxTreasury : 0
  return (
    <div className={`${css.panel} ${css.topBar}`} data-testid="td-topbar">
      <div className={css.stat}>
        <span className={css.statLabel}>Treasury</span>
        <span className={css.statValue} data-testid="td-treasury">
          {snapshot.treasury} ETH
        </span>
        <div className={css.treasuryBar} aria-hidden>
          <div
            className={`${css.treasuryFill} ${treasuryRatio <= 0.3 ? css.treasuryLow : ''}`}
            style={{ width: `${Math.max(0, Math.min(100, treasuryRatio * 100))}%` }}
          />
        </div>
      </div>

      <div className={css.stat}>
        <span className={css.statLabel}>SAFE</span>
        <span className={`${css.statValue} ${css.gold}`} data-testid="td-gold">
          {formatNumber(snapshot.gold)}
        </span>
      </div>

      <div className={css.waveBadge}>
        <span className={css.statLabel}>Wave</span>
        <span className={css.waveBadgeValue} data-testid="td-wave">
          {snapshot.wave}/{snapshot.endless ? '∞' : snapshot.totalWaves}
        </span>
      </div>

      <div className={css.stat}>
        <span className={css.statLabel}>Threats</span>
        <span className={css.statValue}>{snapshot.enemiesAlive}</span>
      </div>

      <div className={css.stat}>
        <span className={css.statLabel}>Neutralised</span>
        <span className={css.statValue}>{formatNumber(snapshot.kills)}</span>
      </div>

      <div className={css.controls}>
        <div className={css.speedGroup} role="group" aria-label="Game speed">
          {SPEEDS.map((speed) => (
            <button
              key={speed}
              type="button"
              className={`${css.iconButton} ${snapshot.speed === speed ? css.iconButtonActive : ''}`}
              onClick={() => onSpeed(speed)}
              aria-pressed={snapshot.speed === speed}
            >
              {speed}x
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${css.iconButton} ${snapshot.paused ? css.iconButtonActive : ''}`}
          onClick={onPause}
          title="Pause (P)"
        >
          {snapshot.paused ? 'Resume' : 'Pause'}
        </button>
        <button type="button" className={css.iconButton} onClick={onMute} title="Toggle sound (M)">
          {snapshot.muted ? 'Sound off' : 'Sound on'}
        </button>
        <button
          type="button"
          className={`${css.iconButton} ${snapshot.bloom ? css.iconButtonActive : ''}`}
          onClick={onBloom}
          title="Toggle bloom post-processing (B)"
        >
          Glow
        </button>
        <button type="button" className={css.iconButton} onClick={onHelp} title="Help (H)">
          ?
        </button>
        <button type="button" className={css.iconButton} onClick={onExit} title="Back to menu">
          Menu
        </button>
      </div>
    </div>
  )
}

export default TopBar
