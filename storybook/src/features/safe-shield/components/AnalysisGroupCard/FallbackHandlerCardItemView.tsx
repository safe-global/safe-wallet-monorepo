import { type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'

export type FallbackHandlerCardItemViewProps = Record<string, never>

/** The card description; the card itself is rendered by the container. */
export const FallbackHandlerCardItemView = (): ReactElement => {
  return (
    <>
      {'Verify the '}
      <ExternalLink
        noIcon={false}
        href={HelpCenterArticle.FALLBACK_HANDLER}
        className="text-inherit [&>span]:underline"
      >
        {'fallback handler'}
      </ExternalLink>
      {' is trusted and secure before proceeding.'}
    </>
  )
}
