import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { type AddressBookItem, Methods } from '@safe-global/safe-apps-sdk'
import type { ReactElement } from 'react'
import { useCallback, useEffect } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import Head from 'next/head'
import type { RequestId } from '@safe-global/safe-apps-sdk'
import { trackSafeAppOpenCount } from '@/services/safe-apps/track-app-usage-count'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useSafeAppFromBackend } from '@/hooks/safe-apps/useSafeAppFromBackend'
import { useSafePermissions } from '@/hooks/safe-apps/permissions'
import { useCurrentChain } from '@/hooks/useChains'
import { isSameUrl } from '@/utils/url'
import useTransactionQueueBarState from '@/components/safe-apps/AppFrame/useTransactionQueueBarState'
import { gtmTrackPageview } from '@/services/analytics/gtm'
import useThirdPartyCookies from './useThirdPartyCookies'
import useAnalyticsFromSafeApp from './useFromAppAnalytics'
import useAppIsLoading from './useAppIsLoading'
import { ThirdPartyCookiesWarning } from './ThirdPartyCookiesWarning'
import TransactionQueueBar, { TRANSACTION_BAR_HEIGHT } from './TransactionQueueBar'
import PermissionsPrompt from '@/components/safe-apps/PermissionsPrompt'
import { PermissionStatus, type SafeAppDataWithPermissions } from '@/components/safe-apps/types'

import css from './styles.module.css'
import SafeAppIframe from './SafeAppIframe'
import { useCustomAppCommunicator } from '@/hooks/safe-apps/useCustomAppCommunicator'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import BlockedAddress from '@/components/common/BlockedAddress'
import { isSafePassApp } from '@/features/walletconnect/services/utils'
import { BRAND_NAME } from '@/config/constants'

const UNKNOWN_APP_NAME = 'Unknown Safe App'

type AppFrameProps = {
  appUrl: string
  allowedFeaturesList: string
  safeAppFromManifest: SafeAppDataWithPermissions
  isNativeEmbed?: boolean
}

const AppFrame = ({ appUrl, allowedFeaturesList, safeAppFromManifest, isNativeEmbed }: AppFrameProps): ReactElement => {
  const { safe, safeLoaded } = useSafeInfo()
  const addressBook = useAddressBook()
  const chainId = useChainId()
  const chain = useCurrentChain()
  const router = useRouter()
  const isSafePass = isSafePassApp(appUrl)
  const sanctionedAddress = useSanctionedAddress(isSafePass)
  const {
    expanded: queueBarExpanded,
    dismissedByUser: queueBarDismissed,
    setExpanded,
    dismissQueueBar,
    transactions,
  } = useTransactionQueueBarState()
  const queueBarVisible = transactions.results.length > 0 && !queueBarDismissed && !isNativeEmbed
  const [remoteApp] = useSafeAppFromBackend(appUrl, safe.chainId)
  const { thirdPartyCookiesDisabled, setThirdPartyCookiesDisabled } = useThirdPartyCookies()
  const { iframeRef, appIsLoading, isLoadingSlow, setAppIsLoading } = useAppIsLoading()
  useAnalyticsFromSafeApp(iframeRef)
  const { permissionsRequest, setPermissionsRequest, confirmPermissionRequest, getPermissions, hasPermission } =
    useSafePermissions()

  const communicator = useCustomAppCommunicator(iframeRef, remoteApp || safeAppFromManifest, chain, {
    onGetPermissions: getPermissions,
    onRequestAddressBook: (origin: string): AddressBookItem[] => {
      if (hasPermission(origin, Methods.requestAddressBook)) {
        return Object.entries(addressBook).map(([address, name]) => ({ address, name, chainId }))
      }

      return []
    },
    onSetPermissions: setPermissionsRequest,
  })

  const onAcceptPermissionRequest = (_origin: string, requestId: RequestId) => {
    const permissions = confirmPermissionRequest(PermissionStatus.GRANTED)
    communicator?.send(permissions, requestId as string)
  }

  const onRejectPermissionRequest = (requestId?: RequestId) => {
    if (requestId) {
      confirmPermissionRequest(PermissionStatus.DENIED)
      communicator?.send('Permissions were rejected', requestId as string, true)
    } else {
      setPermissionsRequest(undefined)
    }
  }

  useEffect(() => {
    if (!remoteApp) return

    trackSafeAppOpenCount(remoteApp.id)
  }, [remoteApp])

  const onIframeLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe || !isSameUrl(iframe.src, appUrl)) {
      return
    }

    setAppIsLoading(false)

    if (!isNativeEmbed) {
      gtmTrackPageview(`${router.pathname}?appUrl=${router.query.appUrl}`, router.asPath)
    }
  }, [appUrl, iframeRef, setAppIsLoading, router, isNativeEmbed])

  if (!safeLoaded) {
    return <div />
  }

  if (sanctionedAddress && isSafePass) {
    return (
      <>
        <Head>
          <title>{`Safe Apps - Viewer - ${remoteApp ? remoteApp.name : UNKNOWN_APP_NAME}`}</title>
        </Head>
        <Box p={2}>
          <BlockedAddress address={sanctionedAddress} featureTitle="Safe{Pass} Safe app" />
        </Box>
      </>
    )
  }

  return (
    <>
      {!isNativeEmbed && (
        <Head>
          <title>{`${BRAND_NAME} - Safe Apps${remoteApp ? ' - ' + remoteApp.name : ''}`}</title>
        </Head>
      )}

      <div className={css.wrapper}>
        {thirdPartyCookiesDisabled && <ThirdPartyCookiesWarning onClose={() => setThirdPartyCookiesDisabled(false)} />}

        {appIsLoading && (
          <div className={css.loadingContainer}>
            {isLoadingSlow && (
              <Typography variant="h4" gutterBottom>
                The Safe App is taking too long to load, consider refreshing.
              </Typography>
            )}
            <CircularProgress size={48} color="primary" />
          </div>
        )}

        <div
          style={{
            height: '100%',
            display: appIsLoading ? 'none' : 'block',
            paddingBottom: queueBarVisible ? TRANSACTION_BAR_HEIGHT : 0,
          }}
        >
          <SafeAppIframe
            appUrl={appUrl}
            allowedFeaturesList={allowedFeaturesList}
            iframeRef={iframeRef}
            onLoad={onIframeLoad}
            title={safeAppFromManifest?.name}
          />
        </div>

        <TransactionQueueBar
          expanded={queueBarExpanded}
          visible={queueBarVisible && !queueBarDismissed}
          setExpanded={setExpanded}
          onDismiss={dismissQueueBar}
          transactions={transactions}
        />

        {!isNativeEmbed && permissionsRequest && (
          <PermissionsPrompt
            isOpen
            origin={permissionsRequest.origin}
            requestId={permissionsRequest.requestId}
            onAccept={onAcceptPermissionRequest}
            onReject={onRejectPermissionRequest}
            permissions={permissionsRequest.request}
          />
        )}
      </div>
    </>
  )
}

export default AppFrame
