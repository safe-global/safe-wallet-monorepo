import NextLink, { type LinkProps } from 'next/link'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import type { ReactElement, ReactNode } from 'react'
import classnames from 'classnames'

import ExternalLink from '@/components/common/ExternalLink'
import css from '@/components/settings/TransactionGuards/styles.module.css'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import SettingsCard from '@/components/settings/SettingsCard'

export type FallbackHandlerWarningViewProps = {
  message: ReactElement | string
  txBuilderLinkPrefix?: string
  txBuilderLink?: LinkProps['href']
}

export const FallbackHandlerWarningView = ({
  message,
  txBuilderLinkPrefix = 'It can be altered via the',
  txBuilderLink,
}: FallbackHandlerWarningViewProps) => {
  return (
    <>
      {message}
      {txBuilderLink !== undefined && !!txBuilderLinkPrefix && (
        <>
          {` ${txBuilderLinkPrefix} `}
          <Link render={<NextLink href={txBuilderLink} />}>Transaction Builder</Link>.
        </>
      )}
    </>
  )
}

export type FallbackHandlerWarningType = 'missing' | 'twap' | 'untrusted'

export type FallbackHandlerViewProps = {
  brandName: string
  hasFallbackHandler: boolean
  isUntrusted: boolean
  warningType?: FallbackHandlerWarningType
  renderWarning: (props: { message: ReactElement | string; txBuilderLinkPrefix?: string }) => ReactNode
  fallbackHandlerAddress?: ReactNode
}

export const FallbackHandlerView = ({
  brandName,
  hasFallbackHandler,
  isUntrusted,
  warningType,
  renderWarning,
  fallbackHandlerAddress,
}: FallbackHandlerViewProps): ReactElement => {
  const warning =
    warningType === 'missing' ? (
      renderWarning({
        message: `The ${brandName} may not work correctly as no fallback handler is currently set.`,
        txBuilderLinkPrefix: 'It can be set via the',
      })
    ) : warningType === 'twap' ? (
      <>This is CoW&apos;s fallback handler. It is needed for this Safe to be able to use the TWAP feature for Swaps.</>
    ) : warningType === 'untrusted' ? (
      renderWarning({
        message: (
          <>
            An <b>unofficial</b> fallback handler is currently set.
          </>
        ),
      })
    ) : undefined

  return (
    <SettingsCard title="Fallback handler">
      <div>
        <Typography>
          The fallback handler adds fallback logic for funtionality that may not be present in the Safe account
          contract. Learn more about the fallback handler{' '}
          <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.FALLBACK_HANDLER}>
            here
          </ExternalLink>
        </Typography>

        <div
          className={classnames(css.guardDisplay, '!block', {
            [css.warning]: !hasFallbackHandler,
            [css.info]: hasFallbackHandler && isUntrusted,
          })}
        >
          {warning && (
            <Typography
              variant="paragraph-small"
              className={classnames('block w-full', { 'mb-2': hasFallbackHandler })}
            >
              {warning}
            </Typography>
          )}

          {fallbackHandlerAddress}
        </div>
      </div>
    </SettingsCard>
  )
}
