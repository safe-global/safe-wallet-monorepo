import type { ReactElement, ReactNode } from 'react'
import { Search, TriangleAlert } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { SCROLL_AREA } from '@/utils/styles'
import { FeatureFlagSectionView } from './FeatureFlagSectionView'
import type { FeatureFlagRowData } from '@/features/feature-flag-overrides/hooks/useFeatureFlagEditorData'

export type FeatureFlagEditorViewProps = {
  search: string
  onSearchChange: (search: string) => void
  hasNoMatches: boolean
  overridden: FeatureFlagRowData[]
  rest: FeatureFlagRowData[]
  renderRow: (row: FeatureFlagRowData) => ReactNode
}

export const FeatureFlagEditorView = ({
  search,
  onSearchChange,
  hasNoMatches,
  overridden,
  rest,
  renderRow,
}: FeatureFlagEditorViewProps): ReactElement => {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Alert
        variant="warning"
        outlined={false}
        className="mb-4 dark:bg-[var(--color-warning-background)] dark:text-[var(--color-text-primary)]"
      >
        <TriangleAlert className="dark:text-[var(--color-warning-main)]" />
        <AlertTitle className="font-bold">Development tool</AlertTitle>
        <AlertDescription className="dark:text-current">
          These are local feature-flag overrides — they live only in this browser and never affect production, the
          config service, or other users. Every override is global: it applies to all chains, whatever per-chain scope
          the config service reports below. Available in dev &amp; staging builds only.
        </AlertDescription>
      </Alert>

      <div className="relative mb-3 shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          type="search"
          placeholder="Search feature flags"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          aria-label="Search flags"
        />
      </div>

      <div className={SCROLL_AREA}>
        {hasNoMatches ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No feature flags match your search.</p>
        ) : (
          <>
            <FeatureFlagSectionView
              title="Local overrides"
              rows={overridden}
              valueLabel="Local value"
              renderRow={renderRow}
            />
            <FeatureFlagSectionView
              title="All feature flags"
              rows={rest}
              valueLabel="Remote value"
              renderRow={renderRow}
            />
          </>
        )}
      </div>
    </div>
  )
}
