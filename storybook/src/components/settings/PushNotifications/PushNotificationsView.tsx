import { Typography } from '@/components/ui/typography'
import { Checkbox } from '@/components/ui/checkbox'
import { Alert, AlertDescription, AlertSeverityIcon } from '@/components/ui/alert'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Field, FieldLabel } from '@/components/ui/field'
import { Link as ShadcnLink } from '@/components/ui/link'
import NextLink from 'next/link'
import type { ReactElement, ReactNode } from 'react'

import { AppRoutes } from '@/config/routes'
import ExternalLink from '@/components/common/ExternalLink'
import SettingsCard from '@/components/settings/SettingsCard'
import { HelpCenterArticle } from '@safe-global/utils/config/constants'

import css from './styles.module.css'

export type NotificationPreferenceValues = {
  incomingTxs: boolean
  outgoingTxs: boolean
  confirmationRequests: boolean
}

export type PushNotificationsViewProps = {
  safeLoaded: boolean
  isDeployed: boolean
  isOwner: boolean
  shouldShowMacHelper: boolean
  isRegistering: boolean
  isUpdatingIndexedDb: boolean
  notificationRenewal: ReactNode
  renderNetworkWarning: (props: { action: string }) => ReactNode
  safeAddressInfo: ReactNode
  renderCheckWallet: (render: (isOk: boolean) => ReactElement) => ReactNode
  globalPushNotifications: ReactNode
  preferences?: NotificationPreferenceValues
  onToggleNotifications: () => void
  onIncomingTxsChange: (checked: boolean) => void
  onOutgoingTxsChange: (checked: boolean) => void
  onConfirmationRequestsChange: (checked: boolean) => void
}

export const PushNotificationsView = ({
  safeLoaded,
  isDeployed,
  isOwner,
  shouldShowMacHelper,
  isRegistering,
  isUpdatingIndexedDb,
  notificationRenewal,
  renderNetworkWarning,
  safeAddressInfo,
  renderCheckWallet,
  globalPushNotifications,
  preferences,
  onToggleNotifications,
  onIncomingTxsChange,
  onOutgoingTxsChange,
  onConfirmationRequestsChange,
}: PushNotificationsViewProps): ReactElement => {
  return (
    <>
      <SettingsCard title="Push notifications" className="mb-4" contentClassName="sm:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-5">
          {notificationRenewal}

          <Typography>
            Enable push notifications for {safeLoaded ? 'this Safe account' : 'your Safe accounts'} in your browser with
            your signature. You will need to enable them again if you clear your browser cache. Learn more about push
            notifications{' '}
            <ExternalLink className="font-bold hover:text-muted-foreground" href={HelpCenterArticle.PUSH_NOTIFICATIONS}>
              here
            </ExternalLink>
          </Typography>

          {shouldShowMacHelper && (
            <Alert variant="info">
              <AlertSeverityIcon variant="info" />
              <AlertDescription>
                <Typography variant="paragraph-small-bold" className="mb-2 block">
                  For macOS users
                </Typography>
                <Typography variant="paragraph-small">
                  Double-check that you have enabled your browser notifications under <b>System Settings</b> &gt;{' '}
                  <b>Notifications</b> &gt; <b>Application Notifications</b> (path may vary depending on OS version).
                </Typography>
              </AlertDescription>
            </Alert>
          )}

          {safeLoaded ? (
            <>
              <Separator />
              {renderNetworkWarning({ action: 'change your notification settings' })}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                {safeAddressInfo}
                {renderCheckWallet((isOk) => {
                  const disabled = !isOk || isRegistering || !isDeployed
                  return (
                    <Field orientation="horizontal" className="w-fit" data-disabled={disabled || undefined}>
                      <Switch
                        data-testid="notifications-switch"
                        checked={!!preferences}
                        onCheckedChange={onToggleNotifications}
                        disabled={disabled}
                      />
                      <FieldLabel>{preferences ? 'On' : 'Off'}</FieldLabel>
                    </Field>
                  )
                })}
              </div>

              <div className={css.globalInfo}>
                <Typography variant="paragraph-small">
                  Want to setup notifications for different or all Safe accounts? You can do so in your{' '}
                  <ShadcnLink className="font-bold" render={<NextLink href={AppRoutes.settings.notifications} />}>
                    global preferences
                  </ShadcnLink>
                  .
                </Typography>
              </div>
            </>
          ) : (
            globalPushNotifications
          )}
        </div>
      </SettingsCard>
      {preferences && (
        <SettingsCard title="Notification" contentClassName="sm:grid-cols-[1fr_2fr]">
          <div className="flex flex-col gap-4">
            <Field orientation="horizontal" className="w-fit">
              <Checkbox
                id="incoming-txs"
                checked={preferences.incomingTxs}
                disabled={isUpdatingIndexedDb}
                onCheckedChange={onIncomingTxsChange}
              />
              <FieldLabel htmlFor="incoming-txs">Incoming transactions</FieldLabel>
            </Field>

            <Field orientation="horizontal" className="w-fit">
              <Checkbox
                id="outgoing-txs"
                checked={preferences.outgoingTxs}
                disabled={isUpdatingIndexedDb}
                onCheckedChange={onOutgoingTxsChange}
              />
              <FieldLabel htmlFor="outgoing-txs">Outgoing transactions</FieldLabel>
            </Field>

            <Field orientation="horizontal" className="w-fit" data-disabled={!isOwner || !preferences || undefined}>
              <Checkbox
                id="confirmation-requests"
                checked={preferences.confirmationRequests}
                disabled={isUpdatingIndexedDb || !isOwner || !preferences}
                onCheckedChange={onConfirmationRequestsChange}
              />
              <FieldLabel htmlFor="confirmation-requests">
                <span className="flex flex-col">
                  <Typography>Confirmation requests</Typography>
                  {!preferences.confirmationRequests && (
                    <Typography variant="paragraph-small" className="text-muted-foreground">
                      {isOwner ? 'Requires your signature' : 'Only signers'}
                    </Typography>
                  )}
                </span>
              </FieldLabel>
            </Field>
          </div>
        </SettingsCard>
      )}
    </>
  )
}
