import { type ReactElement } from 'react'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import ExternalLink from '@/components/common/ExternalLink'

export type DelegateCallCardItemViewProps = Record<string, never>

/** The card description; the card itself is rendered by the container. */
export const DelegateCallCardItemView = (): ReactElement => {
  return (
    <>
      {'This transaction calls a smart contract that will be able to modify your Safe account. '}
      <ExternalLink noIcon href={HelpCenterArticle.UNEXPECTED_DELEGATE_CALL}>
        {'Learn more'}
      </ExternalLink>
    </>
  )
}
