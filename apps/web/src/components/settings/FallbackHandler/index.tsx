import semverSatisfies from 'semver/functions/satisfies'
import type { ReactElement } from 'react'

import EthHashInfo from '@/components/common/EthHashInfo'
import useSafeInfo from '@/hooks/useSafeInfo'
import { BRAND_NAME } from '@/config/constants'
import { useTxBuilderApp } from '@/hooks/safe-apps/useTxBuilderApp'
import { useFallbackHandlerName } from '@/hooks/useFallbackHandlerName'
import { useHasUntrustedFallbackHandler } from '@/hooks/useHasUntrustedFallbackHandler'
import { useIsTWAPFallbackHandler } from '@/features/swap'
import {
  FallbackHandlerView,
  FallbackHandlerWarningView,
  type FallbackHandlerWarningType,
} from '@views/components/settings/FallbackHandler/FallbackHandlerView'

const FALLBACK_HANDLER_VERSION = '>=1.1.1'

export const FallbackHandlerWarning = ({
  message,
  txBuilderLinkPrefix,
}: {
  message: ReactElement | string
  txBuilderLinkPrefix?: string
}) => {
  const txBuilder = useTxBuilderApp()
  return (
    <FallbackHandlerWarningView
      message={message}
      txBuilderLinkPrefix={txBuilderLinkPrefix}
      txBuilderLink={txBuilder ? txBuilder.link : undefined}
    />
  )
}

export const FallbackHandler = (): ReactElement | null => {
  const { safe } = useSafeInfo()
  const fallbackHandlerName = useFallbackHandlerName()
  const isTWAPFallbackHandler = useIsTWAPFallbackHandler()
  const isUntrusted = useHasUntrustedFallbackHandler()

  const supportsFallbackHandler = !!safe.version && semverSatisfies(safe.version, FALLBACK_HANDLER_VERSION)

  if (!supportsFallbackHandler) {
    return null
  }

  const hasFallbackHandler = !!safe.fallbackHandler

  const warningType: FallbackHandlerWarningType | undefined = !hasFallbackHandler
    ? 'missing'
    : isTWAPFallbackHandler
      ? 'twap'
      : isUntrusted
        ? 'untrusted'
        : undefined

  return (
    <FallbackHandlerView
      brandName={BRAND_NAME}
      hasFallbackHandler={hasFallbackHandler}
      isUntrusted={isUntrusted}
      warningType={warningType}
      renderWarning={(props) => <FallbackHandlerWarning {...props} />}
      fallbackHandlerAddress={
        safe.fallbackHandler && (
          <EthHashInfo
            shortAddress={false}
            name={safe.fallbackHandler.name || fallbackHandlerName}
            address={safe.fallbackHandler.value}
            customAvatar={safe.fallbackHandler.logoUri || undefined}
            showCopyButton
            hasExplorer
          />
        )
      }
    />
  )
}
