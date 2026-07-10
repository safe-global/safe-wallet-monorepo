import { useMemo, useState, type ReactElement } from 'react'
import { useAppDispatch } from '@/store'
import { clearAllOverrides } from '@/features/feature-flags/store'
import { useFeatureFlagEditorData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagSection } from './FeatureFlagSection'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import css from './FeatureFlagEditor.module.css'

const matchesSearch = (row: FeatureFlagRowData, search: string): boolean =>
  row.feature.toLowerCase().includes(search.toLowerCase())

export const FeatureFlagEditor = (): ReactElement => {
  const dispatch = useAppDispatch()
  const { overridden, rest } = useFeatureFlagEditorData()
  const [search, setSearch] = useState('')

  const filteredOverridden = useMemo(() => overridden.filter((row) => matchesSearch(row, search)), [overridden, search])
  const filteredRest = useMemo(() => rest.filter((row) => matchesSearch(row, search)), [rest, search])

  return (
    <div className={css.editor}>
      <p role="note">
        Developer tool — local feature-flag overrides. Not available in production. Overrides are global across all
        chains and persist in this browser.
      </p>

      <div className={css.toolbar}>
        <input
          className={css.search}
          type="search"
          placeholder="Search flags"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search flags"
        />

        <button type="button" onClick={() => dispatch(clearAllOverrides())} disabled={overridden.length === 0}>
          Reset all overrides
        </button>
      </div>

      <FeatureFlagSection title="Local overrides" rows={filteredOverridden} />
      <FeatureFlagSection title="All feature flags" rows={filteredRest} />
    </div>
  )
}

export default FeatureFlagEditor
