import { useMemo, useState, type ReactElement } from 'react'
import { RotateCcw, Search, TriangleAlert } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAppDispatch } from '@/store'
import { clearAllOverrides } from '@/features/feature-flags/store'
import { useFeatureFlagEditorData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagSection } from './FeatureFlagSection'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

const matchesSearch = (row: FeatureFlagRowData, search: string): boolean =>
  row.feature.toLowerCase().includes(search.toLowerCase())

export const FeatureFlagEditor = (): ReactElement => {
  const dispatch = useAppDispatch()
  const { overridden, rest } = useFeatureFlagEditorData()
  const [search, setSearch] = useState('')

  const filteredOverridden = useMemo(() => overridden.filter((row) => matchesSearch(row, search)), [overridden, search])
  const filteredRest = useMemo(() => rest.filter((row) => matchesSearch(row, search)), [rest, search])

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-2">
      <div className="mb-2">
        <h1 className="text-2xl font-bold tracking-tight">Feature flags</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Override the feature flags delivered by the config service. Changes apply instantly across all chains — no
          reload needed.
        </p>
      </div>

      <Alert variant="warning" className="my-3">
        <TriangleAlert />
        <AlertTitle>Development tool.</AlertTitle>
        <AlertDescription>
          These are local feature-flag overrides — they live only in this browser and never affect production, the
          config service, or other users. Available in dev &amp; staging builds only.
        </AlertDescription>
      </Alert>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
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

        <Button
          variant="destructive"
          size="lg"
          onClick={() => dispatch(clearAllOverrides())}
          disabled={overridden.length === 0}
        >
          <RotateCcw />
          Reset all overrides
        </Button>
      </div>

      <FeatureFlagSection title="Local overrides" rows={filteredOverridden} />
      <FeatureFlagSection title="All feature flags" rows={filteredRest} />
    </div>
  )
}

export default FeatureFlagEditor
