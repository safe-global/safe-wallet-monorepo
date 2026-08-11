import NextLink from 'next/link'
import { Typography } from '@/components/ui/typography'
import { Link } from '@/components/ui/link'
import semverSatisfies from 'semver/functions/satisfies'
import type { ReactElement } from 'react'
import classnames from 'classnames'

import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { BRAND_NAME } from '@/config/constants'
import ExternalLink from '@/components/common/ExternalLink'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useCompatibilityFallbackHandlerDeployments } from '@/hooks/useCompatibilityFallbackHandlerDeployments'
import { useHasUntrustedFallbackHandler } from '@/hooks/useHasUntrustedFallbackHandler'
import css from '../TransactionGuards/styles.module.css'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'
import { useIsTWAPFallbackHandler } from '@/features/swap'
import SettingsCard from '../SettingsCard'

const FALLBACK_HANDLER_VERSION = '>=1.1.1'

export const FallbackHandlerWarning = ({
  message,
  txBuilderLinkPrefix = 'It can be altered via the',
}: {
  message: ReactElement | string
  txBuilderLinkPrefix?: string
}) => {
  const txBuilder = useTxBuilderApp()
  return (
    <>
      {message}
      {!!txBuilder && !!txBuilderLinkPrefix && (
        <>
          {` ${txBuilderLinkPrefix} `}
          <Link render={<NextLink href={txBuilder.link} />}>Transaction Builder</Link>.
        </>
      )}
    </>
  )
}

export const FallbackHandler = (): ReactElement | null => {
  const { safe } = useSafeInfo()
  const fallbackHandlerDeployments = useCompatibilityFallbackHandlerDeployments()
  const isTWAPFallbackHandler = useIsTWAPFallbackHandler()
  const isUntrusted = useHasUntrustedFallbackHandler()

  const supportsFallbackHandler = !!safe.version && semverSatisfies(safe.version, FALLBACK_HANDLER_VERSION)

  if (!supportsFallbackHandler) {
    return null
  }

  const hasFallbackHandler = !!safe.fallbackHandler

  const warning = !hasFallbackHandler ? (
    <FallbackHandlerWarning
      message={`The ${BRAND_NAME} may not work correctly as no fallback handler is currently set.`}
      txBuilderLinkPrefix="It can be set via the"
    />
  ) : isTWAPFallbackHandler ? (
    <>This is CoW&apos;s fallback handler. It is needed for this Safe to be able to use the TWAP feature for Swaps.</>
  ) : isUntrusted ? (
    <FallbackHandlerWarning
      message={
        <>
          An <b>unofficial</b> fallback handler is currently set.
        </>
      }
    />
  ) : undefined

  return (
    <SettingsCard title="Fallback handler">
      <div>
        <Typography>
          The fallback handler adds fallback logic for funtionality that may not be present in the Safe account
          contract. Learn more about the fallback handler{' '}
          <ExternalLink href={HelpCenterArticle.FALLBACK_HANDLER}>here</ExternalLink>
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

          {safe.fallbackHandler && (
            <EthHashInfo
              shortAddress={false}
              name={safe.fallbackHandler.name || fallbackHandlerDeployments?.contractName}
              address={safe.fallbackHandler.value}
              customAvatar={safe.fallbackHandler.logoUri || undefined}
              showCopyButton
              hasExplorer
            />
          )}
        </div>
      </div>
    </SettingsCard>
  )
}
