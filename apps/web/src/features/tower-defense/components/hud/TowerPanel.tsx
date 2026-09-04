import type { ReactElement } from 'react'
import { TOWERS } from '../../game/config/towers'
import type { SelectedTowerInfo } from '../../game/GameApp'
import type { TargetingMode } from '../../game/config/types'
import { dps, formatNumber } from '../formatters'
import { attackTypeLabel, describeSpecial, TARGET_LABEL } from '../towerText'
import css from '../styles.module.css'

interface TowerPanelProps {
  selected: SelectedTowerInfo
  gold: number
  onUpgrade: () => void
  onSell: () => void
  onClose: () => void
  onTargeting: (mode: TargetingMode) => void
}

const TARGETING_MODES: Array<[TargetingMode, string]> = [
  ['first', 'First'],
  ['strongest', 'Strongest'],
  ['weakest', 'Weakest'],
  ['closest', 'Closest'],
]

const Stat = ({ label, value, next }: { label: string; value: string; next?: string }): ReactElement => (
  <div className={css.statCell}>
    <div className={css.statCellLabel}>{label}</div>
    <div className={css.statCellValue}>
      {value} {next && <span className={css.statCellDelta}>→ {next}</span>}
    </div>
  </div>
)

const TowerPanel = ({ selected, gold, onUpgrade, onSell, onClose, onTargeting }: TowerPanelProps): ReactElement => {
  const def = TOWERS[selected.towerId]
  const lvl = def.levels[selected.level - 1]
  const next = selected.level < 3 ? def.levels[selected.level] : undefined
  const canAfford = selected.upgradeCost !== null && gold >= selected.upgradeCost
  const bonus = Math.round((selected.auraBonus - 1) * 100)
  const fmtDamage = (d: number): string => (bonus > 0 ? `${Math.round(d * selected.auraBonus)}` : `${d}`)
  return (
    <div className={`${css.panel} ${css.towerPanel}`} data-testid="td-tower-panel">
      <div className={css.panelHeader}>
        <div>
          <div className={css.panelTitle}>{def.name}</div>
          <div className={css.panelTagline}>{def.tagline}</div>
        </div>
        <button type="button" className={css.closeButton} onClick={onClose} aria-label="Close tower panel">
          ×
        </button>
      </div>
      <div className={css.levelPips}>
        {[1, 2, 3].map((level) => (
          <span key={level} className={`${css.pip} ${level <= selected.level ? css.pipActive : ''}`} />
        ))}
        <span>Level {selected.level}</span>
        {bonus > 0 && <span className={css.statCellDelta}>+{bonus}% aura</span>}
      </div>
      <div className={css.statsGrid}>
        <Stat label="Damage" value={fmtDamage(lvl.damage)} next={next ? fmtDamage(next.damage) : undefined} />
        <Stat
          label="DPS"
          value={lvl.damage > 0 ? dps(lvl.damage * selected.auraBonus, lvl.cooldown).toFixed(0) : '—'}
          next={next && next.damage > 0 ? dps(next.damage * selected.auraBonus, next.cooldown).toFixed(0) : undefined}
        />
        <Stat label="Range" value={`${lvl.range}`} next={next ? `${next.range}` : undefined} />
        <Stat label="Reload" value={`${lvl.cooldown}s`} next={next ? `${next.cooldown}s` : undefined} />
        <Stat label="Attack" value={attackTypeLabel(def)} />
        <Stat label="Targets" value={TARGET_LABEL[def.targets]} />
        <Stat label="Kills" value={formatNumber(selected.kills)} />
        <Stat label="Damage dealt" value={formatNumber(selected.damageDealt)} />
      </div>
      <div className={css.special}>
        <strong>Now:</strong> {describeSpecial(def, lvl)}
        {next && (
          <>
            <br />
            <strong>Next:</strong> {describeSpecial(def, next)}
          </>
        )}
      </div>
      {def.targets !== 'none' && (
        <div>
          <div className={css.statCellLabel}>
            Targeting <span className={css.kbd}>T</span>
          </div>
          <div className={css.speedGroup} role="group" aria-label="Targeting mode" style={{ marginTop: 6 }}>
            {TARGETING_MODES.map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                className={`${css.iconButton} ${selected.targeting === mode ? css.iconButtonActive : ''}`}
                onClick={() => onTargeting(mode)}
                aria-pressed={selected.targeting === mode}
                data-testid={`td-targeting-${mode}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className={css.actions}>
        <button
          type="button"
          className={css.secondaryButton}
          onClick={onUpgrade}
          disabled={selected.upgradeCost === null || !canAfford}
          data-testid="td-upgrade"
        >
          {selected.upgradeCost === null ? 'Max level' : `Upgrade · ${selected.upgradeCost}`}
          <span className={css.kbd}>U</span>
        </button>
        <button type="button" className={css.dangerButton} onClick={onSell} data-testid="td-sell">
          Sell · {selected.sellValue}
          <span className={css.kbd}>X</span>
        </button>
      </div>
    </div>
  )
}

export default TowerPanel
