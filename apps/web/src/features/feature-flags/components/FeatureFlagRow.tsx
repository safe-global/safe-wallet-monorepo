import type { ReactElement } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { NetworkLogosList } from '@/features/multichain'
import { useAppDispatch } from '@/store'
import { setOverride, clearOverride } from '@/features/feature-flags/store'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import css from './FeatureFlagRow.module.css'

const ConfigScope = ({ scope }: { scope: FeatureFlagRowData['chainScope'] }): ReactElement => {
  if (scope === 'global') return <span data-testid="scope-global">Global</span>
  if (scope === 'off') return <span data-testid="scope-off">Off</span>
  return <NetworkLogosList networks={scope} showHasMore />
}

export const FeatureFlagRow = ({ row }: { row: FeatureFlagRowData }): ReactElement => {
  const dispatch = useAppDispatch()

  return (
    <div className={css.row} data-testid={`feature-flag-row-${row.feature}`}>
      <code className={css.feature}>{row.feature}</code>

      <div className={css.scope}>
        <ConfigScope scope={row.chainScope} />
      </div>

      {row.matchesCurrentChain && (
        <Check
          className={css.matchIndicator}
          aria-label="Matches config service setting for the current chain"
          size={16}
        />
      )}

      <Switch
        checked={row.effective}
        onCheckedChange={(value) => dispatch(setOverride({ feature: row.feature, value }))}
        aria-label={`Toggle ${row.feature}`}
      />

      {row.override !== undefined && (
        <button
          className={css.revertButton}
          aria-label="Revert override"
          onClick={() => dispatch(clearOverride(row.feature))}
          type="button"
        >
          <RotateCcw size={16} />
        </button>
      )}
    </div>
  )
}

export default FeatureFlagRow
