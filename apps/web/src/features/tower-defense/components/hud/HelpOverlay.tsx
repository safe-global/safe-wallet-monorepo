import type { ReactElement } from 'react'
import { ENEMIES } from '../../game/config/enemies'
import { TOWER_ORDER, TOWERS } from '../../game/config/towers'
import { armorLabel, attackTypeLabel, strongAgainst } from '../towerText'
import css from '../styles.module.css'
import { CONTROLS } from './StartScreen'

const HelpOverlay = ({ onClose }: { onClose: () => void }): ReactElement => (
  <div className={css.overlay} onClick={onClose} data-testid="td-help">
    <div className={`${css.panel} ${css.overlayCard}`} onClick={(e) => e.stopPropagation()}>
      <div className={css.panelHeader}>
        <div className={css.panelTitle}>How to defend a Safe</div>
        <button type="button" className={css.closeButton} onClick={onClose} aria-label="Close help">
          ×
        </button>
      </div>
      <div className={css.helpGrid}>
        <div className={css.helpColumn}>
          <h4>Basics</h4>
          <p>
            Attackers spawn at the exploit portal and follow the glowing path to your Safe. Every attacker that reaches
            it drains ETH from the treasury. Build towers on the free tiles next to the path, upgrade them and survive
            every wave.
          </p>
          <p>
            Waves start automatically when the timer runs out. Sending the next wave early pays a SAFE bonus for each
            second you skip. Clearing a wave pays a bonus plus the income from your Recovery Modules.
          </p>
          <h4>Damage types</h4>
          <p>
            <strong>Scan</strong> shreds unarmored bots but struggles against heavy armor. <strong>Impact</strong> is
            best against heavy and fortified units. <strong>Consensus</strong> (magic) excels against light armor.
            Cannons cannot hit air units and stealth units are untargetable until a Tx Simulator reveals them.
          </p>
          <h4>Controls</h4>
          <ul>
            {CONTROLS.map(([label, key]) => (
              <li key={label}>
                {label}: <span className={css.kbd}>{key}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className={css.helpColumn}>
          <h4>Towers</h4>
          <ul>
            {TOWER_ORDER.map((id) => (
              <li key={id}>
                <strong>{TOWERS[id].name}</strong> ({attackTypeLabel(TOWERS[id])}) — {TOWERS[id].description}
              </li>
            ))}
          </ul>
          <h4>Attackers</h4>
          <ul>
            {Object.values(ENEMIES).map((enemy) => (
              <li key={enemy.id}>
                <strong>{enemy.name}</strong> · {armorLabel(enemy)}
                {strongAgainst(enemy).length > 0 && ` · weak to ${strongAgainst(enemy).join(', ')}`} —{' '}
                {enemy.description}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </div>
)

export default HelpOverlay
