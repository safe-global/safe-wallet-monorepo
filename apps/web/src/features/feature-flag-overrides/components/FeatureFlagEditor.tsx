import { useMemo, useState, type ReactElement } from 'react'
import { useFeatureFlagEditorData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagEditorView } from '@views/features/feature-flag-overrides/components/FeatureFlagEditorView'

const matchesSearch = (row: FeatureFlagRowData, search: string): boolean =>
  row.feature.toLowerCase().includes(search.toLowerCase())

export const FeatureFlagEditor = (): ReactElement => {
  const { overridden, rest } = useFeatureFlagEditorData()
  const [search, setSearch] = useState('')

  const filteredOverridden = useMemo(() => overridden.filter((row) => matchesSearch(row, search)), [overridden, search])
  const filteredRest = useMemo(() => rest.filter((row) => matchesSearch(row, search)), [rest, search])
  const hasNoMatches = search !== '' && filteredOverridden.length === 0 && filteredRest.length === 0

  return (
    <FeatureFlagEditorView
      search={search}
      onSearchChange={setSearch}
      hasNoMatches={hasNoMatches}
      overridden={filteredOverridden}
      rest={filteredRest}
      renderRow={(row) => <FeatureFlagRow row={row} />}
    />
  )
}

export default FeatureFlagEditor
