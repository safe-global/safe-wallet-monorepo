import { useCallback, useEffect } from 'react'
import { showNotification, closeNotification } from '@/store/notificationsSlice'
import { ImplementationVersionState } from '@safe-global/safe-gateway-typescript-sdk'
import useSafeInfo from './useSafeInfo'
import { useAppDispatch } from '@/store'
import { AppRoutes } from '@/config/routes'
import { isMigrationToL2Possible, isValidMasterCopy } from '@safe-global/utils/services/contracts/safeContracts'
import { useRouter } from 'next/router'
import useIsSafeOwner from './useIsSafeOwner'
import useSafeAddress from '@/hooks/useSafeAddress'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { isValidSafeVersion } from '@safe-global/utils/services/contracts/utils'
import { isNonCriticalUpdate } from '@safe-global/utils/utils/chains'

const CLI_LINK = {
  href: 'https://github.com/5afe/safe-cli',
  title: 'Get CLI',
}

type DismissedUpdateNotifications = {
  [chainId: string]: {
    [address: string]: number
  }
}

const DISMISS_NOTIFICATION_KEY = 'dismissUpdateSafe'
const OUTDATED_VERSION_KEY = 'safe-outdated-version'

const isUpdateSafeNotification = (groupKey: string) => {
  return groupKey === OUTDATED_VERSION_KEY
}

/**
 * General-purpose notifications relating to the entire Safe
 */
const useSafeNotifications = (): void => {
  const [dismissedUpdateNotifications, setDismissedUpdateNotifications] =
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
        ...dismissedUpdateNotifications,
        [safe.chainId]: {
          ...dismissedUpdateNotifications?.[safe.chainId],
          [safe.address.value]: expiryDate,
        },
      }

      setDismissedUpdateNotifications(newState)
    },
    [dismissedUpdateNotifications, safe.address.value, safe.chainId, setDismissedUpdateNotifications],
  )

  /**
   * Show a notification when the Safe version is out of date
   */
  useEffect(() => {
    if (safeAddress !== urlSafeAddress) return
    if (!isOwner) return

    const dismissedNotificationTimestamp = dismissedUpdateNotifications?.[chainId]?.[safeAddress]

    if (dismissedNotificationTimestamp !== undefined) {
      if (Date.now() >= dismissedNotificationTimestamp) {
        const newState = { ...dismissedUpdateNotifications }
        delete newState?.[chainId]?.[safeAddress]

        setDismissedUpdateNotifications(newState)
      } else {
        return
      }
    }

    // Is Safe version outdated?
    // Non-critical Safe upgrades (versions >= '1.3.0') intentionally skip notifications
    if (implementationVersionState !== ImplementationVersionState.OUTDATED || isNonCriticalUpdate(version)) return

    const isUnsupported = !isValidSafeVersion(version)

    const id = dispatch(
      showNotification({
        variant: 'warning',
        groupKey: OUTDATED_VERSION_KEY,

        message: isUnsupported
          ? `Safe Account version ${version} is not supported by this web app anymore. You can update your Safe Account via the CLI.`
          : `Your Safe Account version ${version} is out of date. Please update it.`,

        link: isUnsupported
          ? CLI_LINK
          : {
              href: {
                pathname: AppRoutes.settings.setup,
                query: { safe: query.safe },
              },
              title: 'Update Safe Account',
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
    dismissedUpdateNotifications,
    setDismissedUpdateNotifications,
    dismissUpdateNotification,
  ])

  /**
   * Show a notification when the Safe master copy is not supported
   */
  useEffect(() => {
    if (isValidMasterCopy(safe.implementationVersionState)) return

    const isMigrationPossible = isMigrationToL2Possible(safe)

    const message = isMigrationPossible
      ? `This Safe Account was created with an unsupported base contract.
           It is possible to migrate it to a compatible base contract. You can migrate it to a compatible contract on the Home screen.`
      : `This Safe Account was created with an unsupported base contract.
           The web interface might not work correctly.
           We recommend using the command line interface instead.`

    const id = dispatch(
      showNotification({
        variant: isMigrationPossible ? 'info' : 'warning',
        message,
        groupKey: 'invalid-mastercopy',
        link: isMigrationPossible ? undefined : CLI_LINK,
      }),
    )

    return () => {
      dispatch(closeNotification({ id }))
    }
  }, [dispatch, safe, safe.implementationVersionState])
}

export default useSafeNotifications
