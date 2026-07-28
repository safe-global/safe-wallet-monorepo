import { useMemo, useState, type ReactElement } from 'react'
import { Search, TriangleAlert } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { SCROLL_AREA } from '@/utils/styles'
import { useFeatureFlagEditorData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagSection } from './FeatureFlagSection'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

const matchesSearch = (row: FeatureFlagRowData, search: string): boolean =>
  row.feature.toLowerCase().includes(search.toLowerCase())

/**
 * Distinctive, non-copy sentinel rendered as a data attribute on the editor root.
 * `bundleExclusion.test.ts` asserts this string is absent from production chunks to
 * prove the editor UI is dead-code-eliminated. Keep it here (a dynamically-imported,
 * prod-excluded module) and unique so unrelated copy changes can't affect the check.
 */
export const EDITOR_BUNDLE_SENTINEL = 'feature-flag-editor:dev-only-ui-sentinel'

export const FeatureFlagEditor = (): ReactElement => {
  const { overridden, rest } = useFeatureFlagEditorData()
  const [search, setSearch] = useState('')

  const filteredOverridden = useMemo(() => overridden.filter((row) => matchesSearch(row, search)), [overridden, search])
  const filteredRest = useMemo(() => rest.filter((row) => matchesSearch(row, search)), [rest, search])

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-bundle-sentinel={EDITOR_BUNDLE_SENTINEL}>
      <Alert variant="warning" className="mb-3 shrink-0">
        <TriangleAlert />
        <AlertTitle>Development tool.</AlertTitle>
        <AlertDescription>
          These are local feature-flag overrides — they live only in this browser and never affect production, the
          config service, or other users. Available in dev &amp; staging builds only.
        </AlertDescription>
      </Alert>

      <div className="relative mb-3 shrink-0">
        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
        <Input
          className="pl-9"
          type="search"
          placeholder="Search feature flags"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search flags"
        />
      </div>

      <div className={SCROLL_AREA}>
        <FeatureFlagSection title="Local overrides" rows={filteredOverridden} />
        <FeatureFlagSection title="All feature flags" rows={filteredRest} />
      </div>
    </div>
  )
}

export default FeatureFlagEditor
