import { type AnalysisResult } from '@safe-global/utils/features/safe-shield/types'
import { AnalysisGroupCardItem } from './AnalysisGroupCardItem'
import { type ReactElement, type ReactNode } from 'react'
import type { LinkProps } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'

interface AnalysisCardItemWithLinkProps {
  result: AnalysisResult
  isPrimary?: boolean
  beforeLinkText: string
  linkText: string
  afterLinkText?: string
  linkUrl: string
  noIcon?: boolean
  linkProps?: Omit<LinkProps, 'href' | 'target' | 'rel'>
}

export const AnalysisCardItemWithLink = ({
  result,
  isPrimary = false,
  beforeLinkText,
  linkText,
  afterLinkText,
  linkUrl,
  noIcon = true,
  linkProps,
}: AnalysisCardItemWithLinkProps): ReactElement => {
  const description: ReactNode = (
    <>
      {beforeLinkText}
      <ExternalLink noIcon={noIcon} href={linkUrl} {...linkProps}>
        {linkText}
      </ExternalLink>
      {afterLinkText}
    </>
  )

  return (
    <AnalysisGroupCardItem
      description={description}
      result={result}
      severity={isPrimary ? result.severity : undefined}
      showImage
    />
  )
}
