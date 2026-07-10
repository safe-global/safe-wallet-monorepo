import type { ReactElement } from 'react'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import css from './FeatureFlagEditor.module.css'

export const FeatureFlagSection = ({
  title,
  rows,
}: {
  title: string
  rows: FeatureFlagRowData[]
}): ReactElement | null => {
  if (rows.length === 0) return null
  return (
    <section className={css.section}>
      <div className={css.sectionHead}>
        <span className={css.sectionTitle}>{title}</span>
        <span className={css.count}>{rows.length}</span>
      </div>

      <div className={css.card}>
        <div className={css.colHead}>
          <span>Feature flag</span>
          <span>Config service</span>
          <span>Local value</span>
        </div>

        {rows.map((row) => (
          <FeatureFlagRow key={row.feature} row={row} />
        ))}
      </div>
    </section>
  )
}

export default FeatureFlagSection
