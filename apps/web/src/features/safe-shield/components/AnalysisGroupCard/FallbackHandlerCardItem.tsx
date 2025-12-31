import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { AnalysisCardItemWithLink } from './AnalysisCardItemWithLink'

interface FallbackHandlerCardItemProps {
  result: AnalysisResult
  isPrimary?: boolean
}

export const FallbackHandlerCardItem = ({ result, isPrimary = false }: FallbackHandlerCardItemProps): ReactElement => {
  return (
    <AnalysisCardItemWithLink
      result={result}
      isPrimary={isPrimary}
      beforeLinkText="Verify the "
      linkText="fallback handler"
      afterLinkText=" is trusted and secure before proceeding."
      linkUrl={HelpCenterArticle.FALLBACK_HANDLER}
      noIcon={false}
      linkProps={{
        color: 'inherit',
        sx: {
          fontWeight: 'inherit',
          '& > span': {
            textDecoration: 'underline',
          },
        },
      }}
    />
  )
}
