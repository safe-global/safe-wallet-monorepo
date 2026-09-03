import { useState, type ReactElement } from 'react'
import { DIFFICULTIES, DIFFICULTY_ORDER } from '../../game/config/difficulty'
import type { Difficulty } from '../../game/config/types'
import { TOTAL_WAVES } from '../../game/config/waves'
import type { BestScores } from '../highScores'
import css from '../styles.module.css'

interface StartScreenProps {
  best: BestScores
  onStart: (difficulty: Difficulty) => void
}

export const CONTROLS: Array<[string, string]> = [
  ['Select tower', '1 – 8'],
  ['Place tower', 'Left click'],
  ['Keep placing', 'Shift + click'],
  ['Cancel / deselect', 'Esc or right click'],
  ['Upgrade selected', 'U'],
  ['Sell selected', 'X'],
  ['Cycle targeting', 'T'],
  ['Send next wave', 'Space'],
  ['Pause', 'P'],
  ['Game speed', 'F'],
  ['Pan camera', 'WASD / arrows / middle drag'],
  ['Rotate camera', 'Q / E / right drag'],
  ['Zoom', 'Mouse wheel'],
  ['Toggle sound', 'M'],
  ['Help', 'H'],
]

const StartScreen = ({ best, onStart }: StartScreenProps): ReactElement => {
  const [difficulty, setDifficulty] = useState<Difficulty>('mainnet')
  return (
    <div className={css.overlay} data-testid="td-start-screen">
      <div className={`${css.panel} ${css.overlayCard}`}>
        <div>
          <div className={css.title}>
            Safe<span className={css.titleBrace}>{'{'}</span>Defense<span className={css.titleBrace}>{'}'}</span>
          </div>
          <div className={css.subtitle}>Hold the threshold. Defend the treasury.</div>
        </div>
        <p className={css.lore}>
          Your Safe holds the treasury. Every attacker in the mempool wants it: phishing bots, address poisoners,
          drainer scripts, blind signers, spoofed frontends and the <strong>Lazarus Group</strong> itself. Stack{' '}
          <strong>
            Safe{'{'}Shield{'}'}
          </strong>{' '}
          scanners, <strong>Hypernative Guards</strong>, <strong>Multisig Cannons</strong>,{' '}
          <strong>Tx Simulators</strong> and <strong>Safenet Relays</strong> along the attack path and survive all{' '}
          {TOTAL_WAVES} waves. Every leaked attacker drains ETH from the vault. When the treasury hits zero, the Safe is
          gone.
        </p>
        <div>
          <div className={css.sectionTitle}>Choose your network</div>
          <div className={css.difficultyGrid}>
            {DIFFICULTY_ORDER.map((id) => {
              const def = DIFFICULTIES[id]
              const record = best[id]
              return (
                <button
                  key={id}
                  type="button"
                  className={`${css.difficultyCard} ${difficulty === id ? css.difficultyCardActive : ''}`}
                  onClick={() => setDifficulty(id)}
                  aria-pressed={difficulty === id}
                  data-testid={`td-difficulty-${id}`}
                >
                  <span className={css.difficultyName}>{def.name}</span>
                  <span className={css.difficultyDesc}>{def.description}</span>
                  <span className={css.difficultyMeta}>
                    <span>{def.treasury} ETH</span>
                    <span>{def.startingGold} SAFE</span>
                    <span>HP ×{def.hpMultiplier}</span>
                  </span>
                  {record && (
                    <span className={css.bestScore}>
                      Best: {record.score.toLocaleString('en-US')} · wave {record.wave}
                      {record.won ? ' · defended' : ''}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
        <div className={css.startRow}>
          <button
            type="button"
            className={css.primaryButton}
            onClick={() => onStart(difficulty)}
            data-testid="td-start"
          >
            Deploy on {DIFFICULTIES[difficulty].name}
          </button>
          <span className={css.footerNote}>Best played on desktop with a mouse. Sound starts on your first click.</span>
        </div>
        <div>
          <div className={css.sectionTitle}>Controls</div>
          <ul className={css.controlsList}>
            {CONTROLS.map(([label, key]) => (
              <li key={label}>
                <span>{label}</span>
                <span className={css.kbd}>{key}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default StartScreen
