import { useState, type ReactElement } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { useNotificationsRenewal } from '@/components/settings/PushNotifications/hooks/useNotificationsRenewal'
import { useIsNotificationsRenewalEnabled } from '@/components/settings/PushNotifications/hooks/useNotificationsTokenVersion'
import { Permission } from '@/permissions/config'
import { NotificationRenewalView } from '@views/components/notification-center/NotificationRenewal/NotificationRenewalView'

const NotificationRenewal = (): ReactElement => {
  const { safe } = useSafeInfo()
  const [isRegistering, setIsRegistering] = useState(false)
  const { renewNotifications, needsRenewal } = useNotificationsRenewal()
  const isNotificationsRenewalEnabled = useIsNotificationsRenewalEnabled()

  if (!needsRenewal || !isNotificationsRenewalEnabled) {
    // No need to renew any Safe's notifications
    return <></>
  }

  const handeSignClick = async () => {
    setIsRegistering(true)
    await renewNotifications()
    setIsRegistering(false)
  }

  return (
    <NotificationRenewalView
      isRegistering={isRegistering}
      isDeployed={safe.deployed}
      onSign={handeSignClick}
      renderCheckWallet={(render) => (
        <CheckWalletWithPermission
          permission={Permission.EnablePushNotifications}
          checkNetwork={!isRegistering && safe.deployed}
        >
          {render}
        </CheckWalletWithPermission>
      )}
    />
  )
}

export default NotificationRenewal
