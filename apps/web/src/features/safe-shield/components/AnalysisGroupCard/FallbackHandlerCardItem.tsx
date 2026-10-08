import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { type ReactElement } from 'react'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { FallbackHandlerCardItemView } from '@views/features/safe-shield/components/AnalysisGroupCard/FallbackHandlerCardItemView'

interface FallbackHandlerCardItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const FallbackHandlerCardItem = ({ result, isPrimary = false }: FallbackHandlerCardItemProps): ReactElement => {
  return (
    <AnalysisGroupCardItem
      description={<FallbackHandlerCardItemView />}
      result={result}
      severity={isPrimary ? result.severity : undefined}
      showImage
    />
  )
}
