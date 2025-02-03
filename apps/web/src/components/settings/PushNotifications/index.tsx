import {
  Grid,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  Switch,
  Divider,
  Link as MuiLink,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import Link from 'next/link'
import { useState } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '@/components/common/EthHashInfo'
import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import { useNotificationRegistrations } from './hooks/useNotificationRegistrations'
import { useNotificationPreferences } from './hooks/useNotificationPreferences'
import { GlobalPushNotifications } from './GlobalPushNotifications'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { HelpCenterArticle, IS_DEV } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { AppRoutes } from '@/config/routes'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { useIsMac } from '@/hooks/useIsMac'
import ExternalLink from '@/components/common/ExternalLink'
import { Permission } from '@/permissions/config'

import css from './styles.module.css'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import NotificationRenewal from '@/components/notification-center/NotificationRenewal'

export const PushNotifications = (): ReactElement => {
  const { safe, safeLoaded } = useSafeInfo()
  const isOwner = useIsSafeOwner()
  const isMac = useIsMac()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUpdatingIndexedDb, setIsUpdatingIndexedDb] = useState(false)
  const theme = useTheme()
  const isLargeScreen = useMediaQuery(theme.breakpoints.up('lg'))

  const { updatePreferences, getPreferences, getAllPreferences } = useNotificationPreferences()
  const { unregisterSafeNotifications, unregisterDeviceNotifications, registerNotifications } =
    useNotificationRegistrations()

  const preferences = getPreferences(safe.chainId, safe.address.value)

  const setPreferences = (newPreferences: NonNullable<ReturnType<typeof getPreferences>>) => {
    setIsUpdatingIndexedDb(true)

    updatePreferences(safe.chainId, safe.address.value, newPreferences)

    setIsUpdatingIndexedDb(false)
  }

  const shouldShowMacHelper = isMac || IS_DEV

  const handleOnChange = async () => {
    setIsRegistering(true)

    if (!preferences) {
      await registerNotifications({ [safe.chainId]: [safe.address.value] })
      trackEvent(PUSH_NOTIFICATION_EVENTS.ENABLE_SAFE)
      setIsRegistering(false)
      return
    }

    const allPreferences = getAllPreferences()
    const totalRegisteredSafesOnChain = allPreferences
      ? Object.values(allPreferences).filter(({ chainId }) => chainId === safe.chainId).length
      : 0
    const shouldUnregisterDevice = totalRegisteredSafesOnChain === 1

    if (shouldUnregisterDevice) {
      await unregisterDeviceNotifications(safe.chainId)
    } else {
      await unregisterSafeNotifications(safe.chainId, safe.address.value)
    }

    trackEvent(PUSH_NOTIFICATION_EVENTS.DISABLE_SAFE)
    setIsRegistering(false)
  }

  return (
    <>
      <Paper sx={{ p: 4, mb: 2 }}>
        <Grid container spacing={3}>
          <Grid item sm={4} xs={12}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
              }}
            >
              Push notifications
            </Typography>
          </Grid>

          <Grid item xs>
            <Grid
              container
              sx={{
                gap: 2.5,
                flexDirection: 'column',
              }}
            >
              <NotificationRenewal />

              <Typography>
                Enable push notifications for {safeLoaded ? 'this Safe Account' : 'your Safe Accounts'} in your browser
                with your signature. You will need to enable them again if you clear your browser cache. Learn more
                about push notifications <ExternalLink href={HelpCenterArticle.PUSH_NOTIFICATIONS}>here</ExternalLink>
              </Typography>

              {shouldShowMacHelper && (
                <Alert severity="info" className={css.macOsInfo}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      mb: 1,
                    }}
                  >
                    For macOS users
                  </Typography>
                  <Typography variant="body2">
                    Double-check that you have enabled your browser notifications under <b>System Settings</b> &gt;{' '}
                    <b>Notifications</b> &gt; <b>Application Notifications</b> (path may vary depending on OS version).
                  </Typography>
                </Alert>
              )}

              {safeLoaded ? (
                <>
                  <Divider />
                  <NetworkWarning action="change your notification settings" />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <EthHashInfo
                      address={safe.address.value}
                      showCopyButton
                      shortAddress={!isLargeScreen}
                      showName={true}
                      hasExplorer
                    />
                    <CheckWalletWithPermission
                      permission={Permission.EnablePushNotifications}
                      checkNetwork={!isRegistering && safe.deployed}
                    >
                      {(isOk) => (
                        <FormControlLabel
                          data-testid="notifications-switch"
                          control={<Switch checked={!!preferences} onChange={handleOnChange} />}
                          label={preferences ? 'On' : 'Off'}
                          disabled={!isOk || isRegistering || !safe.deployed}
                        />
                      )}
                    </CheckWalletWithPermission>
                  </div>

                  <Paper className={css.globalInfo} variant="outlined">
                    <Typography variant="body2">
                      Want to setup notifications for different or all Safe Accounts? You can do so in your{' '}
                      <Link href={AppRoutes.settings.notifications} passHref legacyBehavior>
                        <MuiLink>global preferences</MuiLink>
                      </Link>
                      .
                    </Typography>
                  </Paper>
                </>
              ) : (
                <GlobalPushNotifications />
              )}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
      {preferences && (
        <Paper sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item sm={4} xs={12}>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 700,
                }}
              >
                Notification
              </Typography>
            </Grid>

            <Grid item xs>
              <FormGroup>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preferences[WebhookType.INCOMING_ETHER] && preferences[WebhookType.INCOMING_TOKEN]}
                      disabled={isUpdatingIndexedDb}
                      onChange={(_, checked) => {
                        setPreferences({
                          ...preferences,
                          [WebhookType.INCOMING_ETHER]: checked,
                          [WebhookType.INCOMING_TOKEN]: checked,
                        })

                        trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_INCOMING_TXS, label: checked })
                      }}
                    />
                  }
                  label="Incoming transactions"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        preferences[WebhookType.MODULE_TRANSACTION] &&
                        preferences[WebhookType.EXECUTED_MULTISIG_TRANSACTION]
                      }
                      disabled={isUpdatingIndexedDb}
                      onChange={(_, checked) => {
                        setPreferences({
                          ...preferences,
                          [WebhookType.MODULE_TRANSACTION]: checked,
                          [WebhookType.EXECUTED_MULTISIG_TRANSACTION]: checked,
                        })

                        trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_OUTGOING_TXS, label: checked })
                      }}
                    />
                  }
                  label="Outgoing transactions"
                />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={preferences[WebhookType.CONFIRMATION_REQUEST]}
                      disabled={isUpdatingIndexedDb}
                      onChange={(_, checked) => {
                        const updateConfirmationRequestPreferences = () => {
                          setPreferences({
                            ...preferences,
                            [WebhookType.CONFIRMATION_REQUEST]: checked,
                          })

                          trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_CONFIRMATION_REQUEST, label: checked })
                        }

                        if (checked) {
                          registerNotifications({
                            [safe.chainId]: [safe.address.value],
                          })
                            .then((registered) => {
                              if (registered) {
                                updateConfirmationRequestPreferences()
                              }
                            })
                            .catch(() => null)
                        } else {
                          updateConfirmationRequestPreferences()
                        }
                      }}
                    />
                  }
                  label={
                    <>
                      <Typography>Confirmation requests</Typography>
                      {!preferences[WebhookType.CONFIRMATION_REQUEST] && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: 'text.secondary',
                          }}
                        >
                          {isOwner ? 'Requires your signature' : 'Only signers'}
                        </Typography>
                      )}
                    </>
                  }
                  disabled={!isOwner || !preferences}
                />
              </FormGroup>
            </Grid>
          </Grid>
        </Paper>
      )}
    </>
  )
}
