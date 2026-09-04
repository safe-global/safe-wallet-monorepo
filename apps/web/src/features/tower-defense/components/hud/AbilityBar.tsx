import type { ReactElement } from 'react'
import { FUNDRAISE, HARD_FORK, VITALIK_NUKE } from '../../game/config/abilities'
import type { GameSnapshot } from '../../game/GameApp'
import { formatSeconds } from '../formatters'
import css from '../styles.module.css'

interface AbilityBarProps {
  snapshot: GameSnapshot
  onHardFork: () => void
  onFundraise: () => void
  onCallVitalik: () => void
}

interface AbilityCardProps {
  title: string
  hotkey: string
  status: string
  description: string
  available: boolean
  spent?: boolean
  glyph: string
  tone: 'fork' | 'raise' | 'nuke'
  testId: string
  onClick: () => void
}

const AbilityCard = ({
  title,
  hotkey,
  status,
  description,
  available,
  spent,
  glyph,
  tone,
  testId,
  onClick,
}: AbilityCardProps): ReactElement => (
  <button
    type="button"
    className={`${css.abilityCard} ${css[`ability${tone}`]} ${available ? css.abilityReady : ''} ${spent ? css.abilitySpent : ''}`}
    onClick={onClick}
    aria-disabled={!available}
    data-testid={testId}
    title={description}
  >
    <span className={css.hotkey}>{hotkey}</span>
    <span className={css.abilityGlyph} aria-hidden>
      {glyph}
    </span>
    <span className={css.abilityTitle}>{title}</span>
    <span className={css.abilityStatus}>{status}</span>
    <span className={css.tooltip} role="tooltip">
      <div className={css.tooltipTitle}>{title}</div>
      {description}
    </span>
  </button>
)

/** Emergency powers: hard fork, fundraise and the Vitalik nuke. */
const AbilityBar = ({ snapshot, onHardFork, onFundraise, onCallVitalik }: AbilityBarProps): ReactElement => {
  const { hardFork, fundraise, nuke } = snapshot.abilities
  const hardForkStatus = hardFork.used
    ? 'Chain forked'
    : hardFork.available
      ? 'Ready · dire'
      : `Below ${Math.round(hardFork.threshold * 100)}% treasury`
  const fundraiseStatus =
    fundraise.round === null
      ? 'Cap table full'
      : fundraise.cooldown > 0
        ? `${fundraise.round} in ${formatSeconds(fundraise.cooldown)}`
        : `${fundraise.round} · +${fundraise.eth} ETH for ${fundraise.cost} SAFE`
  const nukeStatus = nuke.inFlight
    ? 'Inbound!'
    : nuke.cooldown > 0
      ? `Busy · ${formatSeconds(nuke.cooldown)}`
      : nuke.available
        ? 'Ready'
        : 'No targets'
  return (
    <div className={`${css.panel} ${css.abilityBar}`} data-testid="td-abilities">
      <AbilityCard
        title={HARD_FORK.name}
        hotkey={HARD_FORK.hotkey}
        status={hardForkStatus}
        description={HARD_FORK.description}
        available={hardFork.available}
        spent={hardFork.used}
        glyph="⑂"
        tone="fork"
        testId="td-hardfork"
        onClick={onHardFork}
      />
      <AbilityCard
        title={FUNDRAISE.name}
        hotkey={FUNDRAISE.hotkey}
        status={fundraiseStatus}
        description={FUNDRAISE.description}
        available={fundraise.available}
        spent={fundraise.round === null}
        glyph="Ξ"
        tone="raise"
        testId="td-fundraise"
        onClick={onFundraise}
      />
      <AbilityCard
        title={VITALIK_NUKE.name}
        hotkey={VITALIK_NUKE.hotkey}
        status={nukeStatus}
        description={VITALIK_NUKE.description}
        available={nuke.available}
        glyph="☄"
        tone="nuke"
        testId="td-vitalik"
        onClick={onCallVitalik}
      />
    </div>
  )
}

export default AbilityBar
