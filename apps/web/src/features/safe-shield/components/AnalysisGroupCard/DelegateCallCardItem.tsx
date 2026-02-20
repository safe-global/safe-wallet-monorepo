import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { AnalysisCardItemWithLink } from './AnalysisCardItemWithLink'

interface DelegateCallCardItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const DelegateCallCardItem = ({ result, isPrimary = false }: DelegateCallCardItemProps): ReactElement => {
  return (
    <AnalysisCardItemWithLink
      result={result}
      isPrimary={isPrimary}
      beforeLinkText="This transaction calls a smart contract that will be able to modify your Safe account. "
      linkText="Learn more"
      linkUrl={HelpCenterArticle.UNEXPECTED_DELEGATE_CALL}
    />
  )
}
