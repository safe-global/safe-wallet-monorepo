import type { ReactElement } from 'react'
import { FeatureFlagRow } from './FeatureFlagRow'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagSectionView } from '@views/features/feature-flag-overrides/components/FeatureFlagSectionView'

export const FeatureFlagSection = ({
  title,
  rows,
  valueLabel,
}: {
  title: string
  rows: FeatureFlagRowData[]
  valueLabel: string
}): ReactElement | null => {
  return (
    <FeatureFlagSectionView
      title={title}
      rows={rows}
      valueLabel={valueLabel}
      renderRow={(row) => <FeatureFlagRow row={row} />}
    />
  )
}

export default FeatureFlagSection
