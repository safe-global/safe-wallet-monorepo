import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { type ReactElement } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

interface DelegateCallCardItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const DelegateCallCardItem = ({ result, isPrimary = false }: DelegateCallCardItemProps): ReactElement => {
  const description = (
    <>
      This transaction calls a smart contract that will be able to modify your Safe account.{' '}
      <ExternalLink noIcon href={HelpCenterArticle.UNEXPECTED_DELEGATE_CALL}>
        Learn more
      </ExternalLink>
    </>
  )

  return (
    <AnalysisGroupCardItem
      description={description}
      result={result}
      severity={isPrimary ? result.severity : undefined}
    />
  )
}
