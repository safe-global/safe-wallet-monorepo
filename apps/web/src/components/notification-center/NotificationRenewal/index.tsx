import { useState, type ReactElement } from 'react'
import { Alert, Box, Button, Typography } from '@mui/material'
import useSafeInfo from '@/hooks/useSafeInfo'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { useNotificationsRenewal } from '@/components/settings/PushNotifications/hooks/useNotificationsRenewal'
import { useIsNotificationsRenewalEnabled } from '@/components/settings/PushNotifications/hooks/useNotificationsTokenVersion'
import { RENEWAL_MESSAGE } from '@/components/settings/PushNotifications/constants'
import { Permission } from '@/permissions/types'

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
      <Alert severity="warning">
        <Typography variant="body2" fontWeight={700} mb={1}>
          Signature needed
        </Typography>
        <Typography variant="body2">{RENEWAL_MESSAGE}</Typography>
      </Alert>
      <Box>
        <CheckWalletWithPermission
          permission={Permission.EnablePushNotifications}
          checkNetwork={!isRegistering && safe.deployed}
        >
          {(isOk) => (
            <Button
              variant="contained"
              size="small"
              sx={{ width: '200px' }}
              onClick={handeSignClick}
              disabled={!isOk || isRegistering || !safe.deployed}
            >
              Sign now
            </Button>
          )}
        </CheckWalletWithPermission>
      </Box>
    </>
  )
}

export default NotificationRenewal
