import { Typography } from '@/components/ui/typography'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Field, FieldLabel } from '@/components/ui/field'
import { Link as ShadcnLink } from '@/components/ui/link'
import NextLink from 'next/link'
import { useState } from 'react'
import type { ReactElement } from 'react'

import useSafeInfo from '@/hooks/useSafeInfo'
import EthHashInfo from '@/components/common/EthHashInfo'
import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import { useNotificationRegistrations } from './hooks/useNotificationRegistrations'
import { useNotificationPreferences } from './hooks/useNotificationPreferences'
import { GlobalPushNotifications } from './GlobalPushNotifications'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { IS_DEV } from '@/config/constants'
import { trackEvent } from '@/services/analytics'
import { PUSH_NOTIFICATION_EVENTS } from '@/services/analytics/events/push-notifications'
import { AppRoutes } from '@/config/routes'
import CheckWalletWithPermission from '@/components/common/CheckWalletWithPermission'
import { useIsMac } from '@/hooks/useIsMac'
import ExternalLink from '@/components/common/ExternalLink'
import { Permission } from '@/permissions/config'
import { useIsMobile } from '@/hooks/use-mobile'

import css from './styles.module.css'
import NetworkWarning from '@/components/new-safe/create/NetworkWarning'
import NotificationRenewal from '@/components/notification-center/NotificationRenewal'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

export const PushNotifications = (): ReactElement => {
  const { safe, safeLoaded } = useSafeInfo()
  const isOwner = useIsSafeOwner()
  const isMac = useIsMac()
  const [isRegistering, setIsRegistering] = useState(false)
  const [isUpdatingIndexedDb, setIsUpdatingIndexedDb] = useState(false)
  const isMobile = useIsMobile()

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
      <div className="mb-4 rounded-lg bg-[var(--color-background-paper)] p-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_2fr]">
          <div>
            <Typography variant="h4">Push notifications</Typography>
          </div>

          <div>
            <div className="flex flex-col gap-5">
              <NotificationRenewal />

              <Typography>
                Enable push notifications for {safeLoaded ? 'this Safe Account' : 'your Safe Accounts'} in your browser
                with your signature. You will need to enable them again if you clear your browser cache. Learn more
                about push notifications <ExternalLink href={HelpCenterArticle.PUSH_NOTIFICATIONS}>here</ExternalLink>
              </Typography>

              {shouldShowMacHelper && (
                <Alert className={css.macOsInfo}>
                  <AlertDescription>
                    <Typography variant="paragraph-small-bold" className="mb-2 block">
                      For macOS users
                    </Typography>
                    <Typography variant="paragraph-small">
                      Double-check that you have enabled your browser notifications under <b>System Settings</b> &gt;{' '}
                      <b>Notifications</b> &gt; <b>Application Notifications</b> (path may vary depending on OS
                      version).
                    </Typography>
                  </AlertDescription>
                </Alert>
              )}

              {safeLoaded ? (
                <>
                  <Separator />
                  <NetworkWarning action="change your notification settings" />

                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <EthHashInfo
                      address={safe.address.value}
                      showCopyButton
                      shortAddress={isMobile}
                      showName={true}
                      hasExplorer
                    />
                    <CheckWalletWithPermission
                      permission={Permission.EnablePushNotifications}
                      checkNetwork={!isRegistering && safe.deployed}
                    >
                      {(isOk) => {
                        const disabled = !isOk || isRegistering || !safe.deployed
                        return (
                          <Field orientation="horizontal" className="w-fit" data-disabled={disabled || undefined}>
                            <Switch
                              data-testid="notifications-switch"
                              checked={!!preferences}
                              onCheckedChange={handleOnChange}
                              disabled={disabled}
                            />
                            <FieldLabel>{preferences ? 'On' : 'Off'}</FieldLabel>
                          </Field>
                        )
                      }}
                    </CheckWalletWithPermission>
                  </div>

                  <div className={css.globalInfo}>
                    <Typography variant="paragraph-small">
                      Want to setup notifications for different or all Safe Accounts? You can do so in your{' '}
                      <ShadcnLink render={<NextLink href={AppRoutes.settings.notifications} />}>
                        global preferences
                      </ShadcnLink>
                      .
                    </Typography>
                  </div>
                </>
              ) : (
                <GlobalPushNotifications />
              )}
            </div>
          </div>
        </div>
      </div>
      {preferences && (
        <div className="rounded-lg bg-[var(--color-background-paper)] p-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1fr_2fr]">
            <div>
              <Typography variant="h4">Notification</Typography>
            </div>

            <div>
              <div className="flex flex-col gap-4">
                <Field orientation="horizontal" className="w-fit">
                  <Checkbox
                    id="incoming-txs"
                    checked={preferences[WebhookType.INCOMING_ETHER] && preferences[WebhookType.INCOMING_TOKEN]}
                    disabled={isUpdatingIndexedDb}
                    onCheckedChange={(checked) => {
                      setPreferences({
                        ...preferences,
                        [WebhookType.INCOMING_ETHER]: checked,
                        [WebhookType.INCOMING_TOKEN]: checked,
                      })

                      trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_INCOMING_TXS, label: checked })
                    }}
                  />
                  <FieldLabel htmlFor="incoming-txs">Incoming transactions</FieldLabel>
                </Field>

                <Field orientation="horizontal" className="w-fit">
                  <Checkbox
                    id="outgoing-txs"
                    checked={
                      preferences[WebhookType.MODULE_TRANSACTION] &&
                      preferences[WebhookType.EXECUTED_MULTISIG_TRANSACTION]
                    }
                    disabled={isUpdatingIndexedDb}
                    onCheckedChange={(checked) => {
                      setPreferences({
                        ...preferences,
                        [WebhookType.MODULE_TRANSACTION]: checked,
                        [WebhookType.EXECUTED_MULTISIG_TRANSACTION]: checked,
                      })

                      trackEvent({ ...PUSH_NOTIFICATION_EVENTS.TOGGLE_OUTGOING_TXS, label: checked })
                    }}
                  />
                  <FieldLabel htmlFor="outgoing-txs">Outgoing transactions</FieldLabel>
                </Field>

                <Field orientation="horizontal" className="w-fit" data-disabled={!isOwner || !preferences || undefined}>
                  <Checkbox
                    id="confirmation-requests"
                    checked={preferences[WebhookType.CONFIRMATION_REQUEST]}
                    disabled={isUpdatingIndexedDb || !isOwner || !preferences}
                    onCheckedChange={(checked) => {
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
                  <FieldLabel htmlFor="confirmation-requests">
                    <span className="flex flex-col">
                      <Typography>Confirmation requests</Typography>
                      {!preferences[WebhookType.CONFIRMATION_REQUEST] && (
                        <Typography variant="paragraph-small" className="text-muted-foreground">
                          {isOwner ? 'Requires your signature' : 'Only signers'}
                        </Typography>
                      )}
                    </span>
                  </FieldLabel>
                </Field>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
