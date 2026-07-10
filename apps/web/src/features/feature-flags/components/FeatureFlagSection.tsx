import type { ReactElement } from 'react'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'

export const FeatureFlagSection = ({
  title,
  rows,
}: {
  title: string
  rows: FeatureFlagRowData[]
}): ReactElement | null => {
  if (rows.length === 0) return null
  return (
    <section>
      <h3>
        {title} ({rows.length})
      </h3>
      {rows.map((row) => (
        <FeatureFlagRow key={row.feature} row={row} />
      ))}
    </section>
  )
}

export default FeatureFlagSection
