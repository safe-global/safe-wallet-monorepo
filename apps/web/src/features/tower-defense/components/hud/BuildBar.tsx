import type { ReactElement } from 'react'
import { TOWER_ORDER, TOWERS } from '../../game/config/towers'
import type { TowerId } from '../../game/config/types'
import type { GameSnapshot } from '../../game/GameApp'
import { dps, hexColor } from '../formatters'
import { attackTypeLabel, describeSpecial, TARGET_LABEL } from '../towerText'
import css from '../styles.module.css'

interface BuildBarProps {
  snapshot: GameSnapshot
  onSelect: (id: TowerId) => void
}

const BuildBar = ({ snapshot, onSelect }: BuildBarProps): ReactElement => (
  <div className={`${css.panel} ${css.buildBar}`} data-testid="td-build-bar">
    {TOWER_ORDER.map((id) => {
      const def = TOWERS[id]
      const lvl = def.levels[0]
      const affordable = snapshot.gold >= lvl.cost
      const active = snapshot.buildTowerId === id
      const icon = snapshot.icons[id]
      return (
        <button
          key={id}
          type="button"
          className={`${css.towerCard} ${active ? css.towerCardActive : ''} ${affordable ? '' : css.towerCardDisabled}`}
          onClick={() => onSelect(id)}
          aria-pressed={active}
          data-testid={`td-build-${id}`}
        >
          <span className={css.hotkey}>{def.hotkey}</span>
          {icon ? (
            <img className={css.towerIcon} src={icon} alt="" />
          ) : (
            <span className={css.towerIconFallback} style={{ background: hexColor(def.color) }}>
              {def.name.charAt(0)}
            </span>
          )}
          <span className={css.towerName}>{def.name}</span>
          <span className={`${css.towerCost} ${affordable ? '' : css.towerCostUnaffordable}`}>{lvl.cost} SAFE</span>
          <span className={css.tooltip} role="tooltip">
            <div className={css.tooltipTitle}>{def.name}</div>
            <div className={css.tooltipTagline}>{def.tagline}</div>
            {def.description}
            <div className={css.tooltipStats}>
              <span>
                Damage <strong>{lvl.damage}</strong>
              </span>
              <span>
                Range <strong>{lvl.range}</strong>
              </span>
              <span>
                Reload <strong>{lvl.cooldown}s</strong>
              </span>
              <span>
                DPS <strong>{lvl.damage > 0 ? dps(lvl.damage, lvl.cooldown).toFixed(0) : '—'}</strong>
              </span>
              <span>
                Type <strong>{attackTypeLabel(def)}</strong>
              </span>
              <span>
                Hits <strong>{TARGET_LABEL[def.targets]}</strong>
              </span>
            </div>
            <div style={{ marginTop: 6 }}>{describeSpecial(def, lvl)}</div>
          </span>
        </button>
      )
    })}
  </div>
)

export default BuildBar
