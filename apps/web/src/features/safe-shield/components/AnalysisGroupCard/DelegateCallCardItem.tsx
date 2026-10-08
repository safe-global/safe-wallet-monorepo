import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { type ReactElement } from 'react'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { DelegateCallCardItemView } from '@views/features/safe-shield/components/AnalysisGroupCard/DelegateCallCardItemView'

interface DelegateCallCardItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const DelegateCallCardItem = ({ result, isPrimary = false }: DelegateCallCardItemProps): ReactElement => {
  return (
    <AnalysisGroupCardItem
      description={<DelegateCallCardItemView />}
      result={result}
      severity={isPrimary ? result.severity : undefined}
      showImage
    />
  )
}
