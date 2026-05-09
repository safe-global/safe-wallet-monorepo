import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import type { BrowserPermission } from '@/hooks/safe-apps/permissions'
import useChainId from '@/hooks/useChainId'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import type { AllowedFeatures } from '../types'
import { PermissionStatus } from '../types'
import { getOrigin } from '../utils'

const SAFE_APPS_INFO_MODAL = 'SafeApps__infoModal'

type useSafeAppsInfoModal = {
  url: string
  safeApp?: SafeAppData
  permissions: AllowedFeatures[]
  addPermissions: (origin: string, permissions: BrowserPermission[]) => void
  getPermissions: (origin: string) => BrowserPermission[]
  remoteSafeAppsLoading: boolean
}

type ModalInfoProps = {
  [chainId: string]: {
    consentsAccepted: boolean
    warningCheckedCustomApps: string[]
  }
}

const useSafeAppsInfoModal = ({
  url,
  safeApp,
  permissions,
  addPermissions,
  getPermissions,
  remoteSafeAppsLoading,
}: useSafeAppsInfoModal): {
  isModalVisible: boolean
  isFirstTimeAccessingApp: boolean
  isSafeAppInDefaultList: boolean
  isConsentAccepted: boolean
  isPermissionsReviewCompleted: boolean
  onComplete: (shouldHide: boolean, permissions: BrowserPermission[]) => void
} => {
  const didMount = useRef(false)
  const chainId = useChainId()
  const [modalInfo = {}, setModalInfo] = useLocalStorage<ModalInfoProps>(SAFE_APPS_INFO_MODAL)
  const [isDisclaimerReadingCompleted, setIsDisclaimerReadingCompleted] = useState(false)

  useEffect(() => {
    if (!url) {
      setIsDisclaimerReadingCompleted(false)
    }
  }, [url])

  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true
      return
    }
  }, [])

  const isPermissionsReviewCompleted = useMemo(() => {
    if (!url) return false

    const safeAppRequiredFeatures = permissions || []
    const featureHasBeenGrantedOrDenied = (feature: AllowedFeatures) =>
      getPermissions(url).some((permission: BrowserPermission) => {
        return permission.feature === feature && permission.status !== PermissionStatus.PROMPT
      })

    // If the app add a new feature in the manifest we need to detect it and show the modal again
    return !!safeAppRequiredFeatures.every(featureHasBeenGrantedOrDenied)
  }, [getPermissions, url, permissions])

  const isSafeAppInDefaultList = useMemo(() => {
    if (!url) return false

    return !!safeApp
  }, [safeApp, url])

  const isFirstTimeAccessingApp = useMemo(() => {
    if (!url) return true

    if (!modalInfo[chainId]) {
      return true
    }

    return !modalInfo[chainId]?.warningCheckedCustomApps?.includes(url)
  }, [chainId, modalInfo, url])

  const isModalVisible = useMemo(() => {
    const isComponentReady = didMount.current
    const shouldShowLegalDisclaimer = !modalInfo[chainId] || modalInfo[chainId].consentsAccepted === false
    const shouldShowAllowedFeatures = !isPermissionsReviewCompleted
    const shouldShowUnknownAppWarning =
      !remoteSafeAppsLoading && !isSafeAppInDefaultList && isFirstTimeAccessingApp && !isDisclaimerReadingCompleted

    return isComponentReady && (shouldShowLegalDisclaimer || shouldShowUnknownAppWarning || shouldShowAllowedFeatures)
  }, [
    chainId,
    isPermissionsReviewCompleted,
    isFirstTimeAccessingApp,
    isSafeAppInDefaultList,
    isDisclaimerReadingCompleted,
    remoteSafeAppsLoading,
    modalInfo,
  ])

  const onComplete = useCallback(
    (shouldHide: boolean, browserPermissions: BrowserPermission[]) => {
      const info = {
        consentsAccepted: true,
        warningCheckedCustomApps: [...(modalInfo[chainId]?.warningCheckedCustomApps || [])],
      }

      const origin = getOrigin(url)

      if (shouldHide && !modalInfo[chainId]?.warningCheckedCustomApps?.includes(origin)) {
        info.warningCheckedCustomApps.push(origin)
      }

      setModalInfo({
        ...modalInfo,
        [chainId]: info,
      })

      if (!isPermissionsReviewCompleted) {
        addPermissions(url, browserPermissions)
      }

      setIsDisclaimerReadingCompleted(true)
    },
    [addPermissions, chainId, isPermissionsReviewCompleted, modalInfo, setModalInfo, url],
  )

  return {
    isModalVisible,
    isSafeAppInDefaultList,
    isFirstTimeAccessingApp,
    isPermissionsReviewCompleted,
    isConsentAccepted: !!modalInfo?.[chainId]?.consentsAccepted,
    onComplete,
  }
}

export default useSafeAppsInfoModal
