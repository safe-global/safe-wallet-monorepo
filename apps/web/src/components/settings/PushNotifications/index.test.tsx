import { render, screen } from '@/tests/test-utils'
import { PushNotifications } from '.'
import useSafeInfo from '@/hooks/useSafeInfo'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsMac } from '@/hooks/useIsMac'
import { useIsMobile } from '@/hooks/use-mobile'
import { useNotificationPreferences } from './hooks/useNotificationPreferences'
import { useNotificationRegistrations } from './hooks/useNotificationRegistrations'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { faker } from '@faker-js/faker'
import { WebhookType } from '@/service-workers/firebase-messaging/webhook-types'
import type { PushNotificationPreferences } from '@/services/push-notifications/preferences'

jest.mock('@/hooks/useSafeInfo')

jest.mock('@/hooks/useIsSafeOwner')

jest.mock('@/hooks/useIsMac')

jest.mock('@/hooks/use-mobile')

jest.mock('./hooks/useNotificationPreferences')

jest.mock('./hooks/useNotificationRegistrations')

jest.mock('@/components/common/CheckWalletWithPermission', () => ({
  __esModule: true,
  default: ({ children }: { children: (isOk: boolean) => React.ReactNode }) => children(true),
}))

jest.mock('@/components/common/EthHashInfo', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <span>{address}</span>,
}))

jest.mock('@/components/new-safe/create/NetworkWarning', () => ({
  __esModule: true,
  default: ({ action }: { action: string }) => <span>{action}</span>,
}))

jest.mock('@/components/notification-center/NotificationRenewal', () => ({
  __esModule: true,
  default: () => null,
}))

type NotificationPreferenceMap = PushNotificationPreferences[keyof PushNotificationPreferences]['preferences']

const mockSafeAddress = faker.finance.ethereumAddress()
const notificationPreferences: NotificationPreferenceMap = {
  [WebhookType.EXECUTED_MULTISIG_TRANSACTION]: true,
  [WebhookType.INCOMING_ETHER]: true,
  [WebhookType.INCOMING_TOKEN]: true,
  [WebhookType.MODULE_TRANSACTION]: true,
  [WebhookType.CONFIRMATION_REQUEST]: true,
  [WebhookType.SAFE_CREATED]: false,
  [WebhookType._PENDING_MULTISIG_TRANSACTION]: true,
  [WebhookType._NEW_CONFIRMATION]: true,
  [WebhookType._OUTGOING_ETHER]: true,
  [WebhookType._OUTGOING_TOKEN]: true,
}

describe('PushNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValue({
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: mockSafeAddress } })
        .with({ chainId: '1' })
        .with({ deployed: true })
        .build(),
      safeAddress: mockSafeAddress,
      safeLoaded: true,
    } as ReturnType<typeof useSafeInfo>)
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValue(true)
    ;(useIsMac as jest.MockedFunction<typeof useIsMac>).mockReturnValue(false)
    ;(useIsMobile as jest.MockedFunction<typeof useIsMobile>).mockReturnValue(false)
    ;(useNotificationPreferences as jest.MockedFunction<typeof useNotificationPreferences>).mockReturnValue({
      uuid: 'uuid',
      getAllPreferences: jest.fn(() => ({
        [`1:${mockSafeAddress}`]: {
          chainId: '1',
          safeAddress: mockSafeAddress,
          preferences: notificationPreferences,
        },
      })),
      getPreferences: jest.fn(() => notificationPreferences),
      updatePreferences: jest.fn(),
      createPreferences: jest.fn(),
      deletePreferences: jest.fn(),
      deleteAllChainPreferences: jest.fn(),
      _getAllPreferenceEntries: jest.fn(),
      _deleteManyPreferenceKeys: jest.fn(),
      getChainPreferences: jest.fn(),
    } as ReturnType<typeof useNotificationPreferences>)
    ;(useNotificationRegistrations as jest.MockedFunction<typeof useNotificationRegistrations>).mockReturnValue({
      registerNotifications: jest.fn(),
      unregisterSafeNotifications: jest.fn(),
      unregisterDeviceNotifications: jest.fn(),
    } as ReturnType<typeof useNotificationRegistrations>)
  })

  it('renders push notification settings in shared card shells', () => {
    render(<PushNotifications />)

    expect(screen.getByText('Push notifications').closest('[data-slot="card"]')).toHaveClass('mb-4')
    expect(screen.getByText('Notification').closest('[data-slot="card"]')).toHaveClass('p-8')
    expect(screen.getByTestId('notifications-switch')).toBeChecked()
    expect(screen.getByLabelText('Incoming transactions')).toBeInTheDocument()
    expect(screen.getByLabelText('Outgoing transactions')).toBeInTheDocument()
    expect(screen.getByText('Confirmation requests')).toBeInTheDocument()
  })
})
