import { useCallback, useEffect } from 'react'
import { showNotification, closeNotification } from '@/store/notificationsSlice'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from './useSafeInfo'
import { useAppDispatch } from '@/store'
import { AppRoutes } from '@/config/routes'
import { isValidMasterCopy } from '@/services/contracts/safeContracts'
import { useRouter } from 'next/router'
import useIsSafeOwner from './useIsSafeOwner'
import { isValidSafeVersion } from './coreSDK/safeCoreSDK'
import useSafeAddress from '@/hooks/useSafeAddress'
import { type DismissedUpdateNotifications } from '@/components/common/Notifications'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const CLI_LINK = {
  href: 'https://github.com/5afe/safe-cli',
  title: 'Get CLI',
}

export const DISMISS_NOTIFICATION_KEY = 'dismissUpdateSafe'
export const OUTDATED_VERSION_KEY = 'safe-outdated-version'

export const isUpdateSafeNotification = (groupKey: string) => {
  return groupKey === OUTDATED_VERSION_KEY
}

/**
 * General-purpose notifications relating to the entire Safe
 */
const useSafeNotifications = (): void => {
  const [dismissedNotifications, setDismissedNotifications] =
    useLocalStorage<DismissedUpdateNotifications>(DISMISS_NOTIFICATION_KEY)
  const dispatch = useAppDispatch()
  const { query } = useRouter()
  const { safe, safeAddress } = useSafeInfo()
  const { chainId, version, implementationVersionState } = safe
  const isOwner = useIsSafeOwner()
  const urlSafeAddress = useSafeAddress()

  const dismissUpdateNotification = useCallback(
    (groupKey: string) => {
      const EXPIRY_DAYS = 90

      if (!isUpdateSafeNotification(groupKey)) return

      const expiryDate = Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000

      const newState = {
        ...dismissedNotifications,
        [safe.chainId]: {
          ...dismissedNotifications?.[safe.chainId],
          [safe.address.value]: expiryDate,
        },
      }

      setDismissedNotifications(newState)
    },
    [dismissedNotifications, safe.address.value, safe.chainId, setDismissedNotifications],
  )

  /**
   * Show a notification when the Safe version is out of date
   */

  useEffect(() => {
    if (safeAddress !== urlSafeAddress) return
    if (!isOwner) return
    if (implementationVersionState !== ImplementationVersionState.OUTDATED) return

    const dismissedNotificationTimestamp = dismissedNotifications?.[chainId]?.[safeAddress]

    if (dismissedNotificationTimestamp) {
      if (Date.now() >= dismissedNotificationTimestamp) {
        const newState = { ...dismissedNotifications }
        delete newState?.[chainId]?.[safeAddress]

        setDismissedNotifications(newState)
      } else {
        return
      }
    }

    const isUnsupported = !isValidSafeVersion(version)

    const id = dispatch(
      showNotification({
        variant: 'warning',
        groupKey: OUTDATED_VERSION_KEY,

        message: isUnsupported
          ? `Safe version ${version} is not supported by this web app anymore. You can update your Safe via the CLI.`
          : `Your Safe version ${version} is out of date. Please update it.`,

        link: isUnsupported
          ? CLI_LINK
          : {
              href: {
                pathname: AppRoutes.settings.setup,
                query: { safe: query.safe },
              },
              title: 'Update Safe',
            },

        onClose: () => dismissUpdateNotification(OUTDATED_VERSION_KEY),
      }),
    )

    return () => {
      dispatch(closeNotification({ id }))
    }
  }, [
    dispatch,
    implementationVersionState,
    version,
    query.safe,
    isOwner,
    safeAddress,
    urlSafeAddress,
    chainId,
    dismissedNotifications,
    setDismissedNotifications,
    dismissUpdateNotification,
  ])

  /**
   * Show a notification when the Safe master copy is not supported
   */

  useEffect(() => {
    if (isValidMasterCopy(safe)) return

    const id = dispatch(
      showNotification({
        variant: 'warning',
        message: `This Safe was created with an unsupported base contract.
           The web interface might not work correctly.
           We recommend using the command line interface instead.`,
        groupKey: 'invalid-mastercopy',
        link: CLI_LINK,
      }),
    )

    return () => {
      dispatch(closeNotification({ id }))
    }
  }, [dispatch, safe])
}

export default useSafeNotifications
