import type { CSSProperties, ReactElement } from 'react'
import { Check, Globe, RotateCcw } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { NetworkLogosList } from '@/features/multichain'
import { cn } from '@/utils/cn'
import { useAppDispatch } from '@/store'
import { setOverride, clearOverride } from '@/features/feature-flags/store'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

// Kept in the DOM but hidden so the controls column stays aligned across rows.
const HIDDEN: CSSProperties = { visibility: 'hidden' }

// Shared so the section column header lines up with the rows.
export const GRID = 'grid grid-cols-[minmax(200px,1fr)_minmax(140px,240px)_auto] items-center gap-3'

const ConfigScope = ({ scope }: { scope: FeatureFlagRowData['chainScope'] }): ReactElement => {
  if (scope === 'global') {
    return (
      <Badge variant="outline" className="border-success-muted bg-success-subtle text-success-strong gap-1">
        <Globe />
        Global
      </Badge>
    )
  }
  if (scope === 'off') {
    return <Badge variant="secondary">Off</Badge>
  }
  return <NetworkLogosList networks={scope} showHasMore />
}

export const FeatureFlagRow = ({ row }: { row: FeatureFlagRowData }): ReactElement => {
  const dispatch = useAppDispatch()
  const isOverridden = row.override !== undefined

  return (
    <div
      className={cn(
        GRID,
        'relative border-b px-4 py-3 last:border-b-0',
        isOverridden &&
          "bg-success-subtle before:absolute before:inset-y-0 before:left-0 before:w-[3px] before:bg-success-strong before:content-['']",
      )}
    >
      <code className="text-foreground font-mono text-[13.5px] font-semibold tracking-tight break-words">
        {row.feature}
      </code>

      <div className="flex min-w-0 items-center gap-1">
        <ConfigScope scope={row.chainScope} />
      </div>

      <div className="flex items-center justify-end gap-2">
        <Switch
          checked={row.effective}
          onCheckedChange={(value) => dispatch(setOverride({ feature: row.feature, value }))}
          aria-label={`Toggle ${row.feature}`}
        />

        <Check
          className="text-success-strong size-4 shrink-0"
          style={row.matchesCurrentChain ? undefined : HIDDEN}
          aria-label="Matches config service setting for the current chain"
        />

        <Button
          variant="outline"
          size="icon-xs"
          style={isOverridden ? undefined : HIDDEN}
          aria-label="Revert override"
          onClick={() => dispatch(clearOverride(row.feature))}
          tabIndex={isOverridden ? undefined : -1}
        >
          <RotateCcw />
        </Button>
      </div>
    </div>
  )
}

export default FeatureFlagRow
