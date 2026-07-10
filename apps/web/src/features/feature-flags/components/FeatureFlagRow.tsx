import type { CSSProperties, ReactElement } from 'react'
import { Check, Globe, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { NetworkLogosList } from '@/features/multichain'
import { useAppDispatch } from '@/store'
import { setOverride, clearOverride } from '@/features/feature-flags/store'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import css from './FeatureFlagEditor.module.css'

// Kept in the DOM but hidden so the controls column stays aligned across rows.
const HIDDEN: CSSProperties = { visibility: 'hidden' }

const ConfigScope = ({ scope }: { scope: FeatureFlagRowData['chainScope'] }): ReactElement => {
  if (scope === 'global') {
    return (
      <span className={`${css.pill} ${css.pillGlobal}`} data-testid="scope-global">
        <Globe size={12} />
        Global
      </span>
    )
  }
  if (scope === 'off') {
    return (
      <span className={`${css.pill} ${css.pillOff}`} data-testid="scope-off">
        Off
      </span>
    )
  }
  return <NetworkLogosList networks={scope} showHasMore />
}

export const FeatureFlagRow = ({ row }: { row: FeatureFlagRowData }): ReactElement => {
  const dispatch = useAppDispatch()
  const isOverridden = row.override !== undefined

  return (
    <div className={`${css.row} ${isOverridden ? css.isOver : ''}`} data-testid={`feature-flag-row-${row.feature}`}>
      <code className={css.featureKey}>{row.feature}</code>

      <div className={css.configCell}>
        <ConfigScope scope={row.chainScope} />
      </div>

      <div className={css.controls}>
        <Switch
          checked={row.effective}
          onCheckedChange={(value) => dispatch(setOverride({ feature: row.feature, value }))}
          aria-label={`Toggle ${row.feature}`}
        />

        <Check
          className={css.matchIndicator}
          style={row.matchesCurrentChain ? undefined : HIDDEN}
          aria-label="Matches config service setting for the current chain"
          size={16}
        />

        <button
          className={css.revertButton}
          style={isOverridden ? undefined : HIDDEN}
          aria-label="Revert override"
          onClick={() => dispatch(clearOverride(row.feature))}
          type="button"
          tabIndex={isOverridden ? undefined : -1}
        >
          <RotateCcw size={14} />
        </button>
      </div>
    </div>
  )
}

export default FeatureFlagRow
