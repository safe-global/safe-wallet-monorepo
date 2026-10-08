import useAddressBook from '@/hooks/useAddressBook'
import useChainId from '@/hooks/useChainId'
import { type AddressBookItem, Methods } from '@safe-global/safe-apps-sdk'
import type { ReactElement } from 'react'
import { useCallback, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import type { RequestId } from '@safe-global/safe-apps-sdk'
import { trackSafeAppOpenCount } from '@/services/safe-apps/track-app-usage-count'
import { isSafePassApp } from '@/services/safe-apps/utils'
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
import TransactionQueueBar from './TransactionQueueBar'
import PermissionsPrompt from '@/components/safe-apps/PermissionsPrompt'
import { PermissionStatus, type SafeAppDataWithPermissions } from '@/components/safe-apps/types'

import SafeAppIframe from './SafeAppIframe'
import { useCustomAppCommunicator } from '@/hooks/safe-apps/useCustomAppCommunicator'
import { useSanctionedAddress } from '@/hooks/useSanctionedAddress'
import BlockedAddress from '@/components/common/BlockedAddress'
import { BRAND_NAME } from '@/config/constants'
import { AppFrameBlockedView, AppFrameEmptyView, AppFrameView } from '@views/components/safe-apps/AppFrame/AppFrameView'

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
    // Reject passes the id and persists a denial. Closing the modal only dismisses, so the app can ask
    // again — but either way it has to be answered, or its SDK call never settles.
    const isExplicitReject = requestId !== undefined
    const id = requestId ?? permissionsRequest?.requestId

    if (isExplicitReject) {
      confirmPermissionRequest(PermissionStatus.DENIED)
    } else {
      setPermissionsRequest(undefined)
    }

    if (id != null) {
      communicator?.send('Permissions were rejected', id as string, true)
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
    return <AppFrameEmptyView />
  }

  if (sanctionedAddress && isSafePass) {
    return (
      <>
        <Head>
          <title>{`Safe Apps - Viewer - ${remoteApp ? remoteApp.name : UNKNOWN_APP_NAME}`}</title>
        </Head>
        <AppFrameBlockedView
          renderBlockedAddress={(props) => <BlockedAddress address={sanctionedAddress} {...props} />}
        />
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

      <AppFrameView
        showCookiesWarning={thirdPartyCookiesDisabled}
        onCloseCookiesWarning={() => setThirdPartyCookiesDisabled(false)}
        appIsLoading={appIsLoading}
        isLoadingSlow={isLoadingSlow}
        queueBarVisible={queueBarVisible}
        iframe={
          <SafeAppIframe
            appUrl={appUrl}
            allowedFeaturesList={allowedFeaturesList}
            iframeRef={iframeRef}
            onLoad={onIframeLoad}
            title={safeAppFromManifest?.name}
          />
        }
        queueBar={
          <TransactionQueueBar
            expanded={queueBarExpanded}
            visible={queueBarVisible && !queueBarDismissed}
            setExpanded={setExpanded}
            onDismiss={dismissQueueBar}
            transactions={transactions}
          />
        }
        permissionsPrompt={
          !isNativeEmbed &&
          permissionsRequest && (
            <PermissionsPrompt
              isOpen
              origin={permissionsRequest.origin}
              requestId={permissionsRequest.requestId}
              onAccept={onAcceptPermissionRequest}
              onReject={onRejectPermissionRequest}
              permissions={permissionsRequest.request}
            />
          )
        }
      />
    </>
  )
}

export default AppFrame
