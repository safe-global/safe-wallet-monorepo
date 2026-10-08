import type { ReactElement } from 'react'
import { NetworkLogosList } from '@/features/multichain'
import { useAppDispatch } from '@/store'
import { setOverride, clearOverride } from '@/features/feature-flag-overrides/store'
import type { FeatureFlagRowData } from '../hooks/useFeatureFlagEditorData'
import { FeatureFlagRowView } from '@views/features/feature-flag-overrides/components/FeatureFlagRowView'

export { GRID } from '@views/features/feature-flag-overrides/components/FeatureFlagRowView'

export const FeatureFlagRow = ({ row }: { row: FeatureFlagRowData }): ReactElement => {
  const dispatch = useAppDispatch()
  const scope = row.chainScope

  return (
    <FeatureFlagRowView
      row={row}
      networkLogos={scope !== 'global' && scope !== 'off' ? <NetworkLogosList networks={scope} showHasMore /> : null}
      onToggle={(value) => dispatch(setOverride({ feature: row.feature, value }))}
      onRevert={() => dispatch(clearOverride(row.feature))}
    />
  )
}

export default FeatureFlagRow
