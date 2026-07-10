import { useMemo, useState, type ReactElement } from 'react'
import { RotateCcw, Search, TriangleAlert } from 'lucide-react'
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
      <div className={css.head}>
        <h1 className={css.h1}>Feature flags</h1>
        <p className={css.sub}>
          Override the feature flags delivered by the config service. Changes apply instantly across all chains — no
          reload needed.
        </p>
      </div>

      <div className={css.banner} role="note">
        <TriangleAlert className={css.bannerIcon} size={18} />
        <div>
          <b>Development tool.</b> These are local feature-flag overrides — they live only in this browser and never
          affect production, the config service, or other users. Available in dev &amp; staging builds only.
        </div>
      </div>

      <div className={css.toolbar}>
        <div className={css.search}>
          <Search className={css.searchIcon} size={16} />
          <input
            className={css.searchInput}
            type="search"
            placeholder="Search feature flags"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search flags"
          />
        </div>

        <button
          className={css.resetButton}
          type="button"
          onClick={() => dispatch(clearAllOverrides())}
          disabled={overridden.length === 0}
        >
          <RotateCcw size={15} />
          Reset all overrides
        </button>
      </div>

      <FeatureFlagSection title="Local overrides" rows={filteredOverridden} />
      <FeatureFlagSection title="All feature flags" rows={filteredRest} />
    </div>
  )
}

export default FeatureFlagEditor
