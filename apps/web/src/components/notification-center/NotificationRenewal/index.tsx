import { useState, type ReactElement } from 'react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import useSafeInfo from '@/hooks/useSafeInfo'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { useNotificationsRenewal } from '@/components/settings/PushNotifications/hooks/useNotificationsRenewal'
import { useIsNotificationsRenewalEnabled } from '@/components/settings/PushNotifications/hooks/useNotificationsTokenVersion'
import { RENEWAL_MESSAGE } from '@/components/settings/PushNotifications/constants'
import { Permission } from '@/permissions/config'

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
    <>
      <Alert variant="warning">
        <AlertTitle className="mb-2">Signature needed</AlertTitle>
        <AlertDescription>{RENEWAL_MESSAGE}</AlertDescription>
      </Alert>
      <div>
        <CheckWalletWithPermission
          permission={Permission.EnablePushNotifications}
          checkNetwork={!isRegistering && safe.deployed}
        >
          {(isOk) => (
            <Button
              variant="default"
              size="sm"
              className="w-[200px]"
              onClick={handeSignClick}
              disabled={!isOk || isRegistering || !safe.deployed}
            >
              Sign now
            </Button>
          )}
        </CheckWalletWithPermission>
      </div>
    </>
  )
}

export default NotificationRenewal
