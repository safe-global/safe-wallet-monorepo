import {
  ConflictType,
  DetailedExecutionInfoType,
  LabelValue,
  TransactionInfoType,
  TransactionListItemType,
  TransactionStatus,
} from '@safe-global/store/gateway/types'
import { faker } from '@faker-js/faker'
import { getSDKVersion, Methods } from '@safe-global/safe-apps-sdk'
import type { Permission } from '@safe-global/safe-apps-sdk/dist/types/types/permissions'
import { act, render, renderHook, screen, fireEvent, waitFor } from '@/tests/test-utils'
import AppFrame from '@/components/safe-apps/AppFrame'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { getEmptySafeApp } from '@/components/safe-apps/utils'
import type { SafePermissions } from '@/hooks/safe-apps/permissions'
import useLocalStorage from '@/services/local-storage/useLocalStorage'

const emptySafeApp = getEmptySafeApp()

const APP_ORIGIN = `https://${faker.internet.domainName()}`
const permissionsTestApp = { ...getEmptySafeApp(APP_ORIGIN), name: 'Permissions test app' }

const renderAppFrameWithLoadedSafe = async () => {
  render(<AppFrame appUrl={APP_ORIGIN} allowedFeaturesList="" safeAppFromManifest={permissionsTestApp} />, {
    initialReduxState: { safeInfo: { loading: false, loaded: true, data: defaultSafeInfo } },
  })

  const iframe = await screen.findByTitle<HTMLIFrameElement>(permissionsTestApp.name)
  const appWindow = iframe.contentWindow
  if (!appWindow) throw new Error('The Safe App iframe has no window')

  return { appWindow, replyToApp: jest.spyOn(appWindow, 'postMessage') }
}

const sendFromApp = (appWindow: Window, method: Methods, params?: unknown): string => {
  const id = faker.string.alphanumeric(10)
  const data = { id, method, params, env: { sdkVersion: getSDKVersion() } }

  act(() => {
    window.dispatchEvent(new MessageEvent('message', { data, origin: APP_ORIGIN, source: appWindow }))
  })

  return id
}

// Writing through the hook also resets its in-memory cache, which outlives localStorage.clear().
const storeSafePermissions = (permissions: SafePermissions): void => {
  const { result } = renderHook(() => useLocalStorage<SafePermissions>('SafeApps__safePermissions'))
  act(() => result.current[1](permissions))
}

describe('AppFrame permission requests', () => {
  beforeEach(() => {
    storeSafePermissions({})
  })

  it('asks the user about a wallet_requestPermissions call and replies with the grant', async () => {
    const { appWindow, replyToApp } = await renderAppFrameWithLoadedSafe()

    const requestId = sendFromApp(appWindow, Methods.wallet_requestPermissions, [{ requestAddressBook: {} }])
    expect(await screen.findByText('Permissions Request')).toBeInTheDocument()
    expect(screen.getByText('Access to your address book')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Accept' }))

    const grant = expect.objectContaining({ invoker: APP_ORIGIN, parentCapability: 'requestAddressBook', caveats: [] })
    await waitFor(() =>
      expect(replyToApp).toHaveBeenCalledWith(
        expect.objectContaining({ id: requestId, success: true, data: [grant] }),
        APP_ORIGIN,
      ),
    )
  })

  it('replies with an error when the user rejects a wallet_requestPermissions call', async () => {
    const { appWindow, replyToApp } = await renderAppFrameWithLoadedSafe()

    const requestId = sendFromApp(appWindow, Methods.wallet_requestPermissions, [{ requestAddressBook: {} }])
    fireEvent.click(await screen.findByRole('button', { name: 'Reject' }))

    await waitFor(() =>
      expect(replyToApp).toHaveBeenCalledWith(
        expect.objectContaining({ id: requestId, success: false, error: 'Permissions were rejected' }),
        APP_ORIGIN,
      ),
    )
  })

  it('replies to wallet_getPermissions with the permissions stored for the app', async () => {
    const stored: Permission[] = [
      { invoker: APP_ORIGIN, parentCapability: 'requestAddressBook', date: faker.date.past().getTime(), caveats: [] },
    ]
    storeSafePermissions({ [APP_ORIGIN]: stored })
    const { appWindow, replyToApp } = await renderAppFrameWithLoadedSafe()

    const requestId = sendFromApp(appWindow, Methods.wallet_getPermissions)

    await waitFor(() =>
      expect(replyToApp).toHaveBeenCalledWith(
        expect.objectContaining({ id: requestId, success: true, data: stored }),
        APP_ORIGIN,
      ),
    )
  })
})

describe('AppFrame', () => {
  it('should not show the transaction queue bar when there are no queued transactions', () => {
    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />)

    expect(screen.queryAllByText('(0) Transaction queue').length).toBe(0)
  })

  it('should show queued transactions in the queue bar', () => {
    render(<AppFrame appUrl="https://app.url" allowedFeaturesList="" safeAppFromManifest={emptySafeApp} />, {
      initialReduxState: {
        safeInfo: {
          loading: true,
          loaded: true,
          data: defaultSafeInfo,
        },
        txQueue: {
          data: {
            results: [
              {
                type: TransactionListItemType.LABEL,
                label: LabelValue.Next,
              },
              {
                type: TransactionListItemType.TRANSACTION,
                transaction: {
                  id: 'multisig_0x1A84c9Fa70b94aFa053073851766E61e8F45029D_0x457db826b96f73dde4d13d2491f0a7be06ec7e6f9d7f0fb09efa48f79b6dd93d',
                  timestamp: 1663759037121,
                  txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
                  txInfo: {
                    type: TransactionInfoType.CUSTOM,
                    to: {
                      value: '0x1A84c9Fa70b94aFa053073851766E61e8F45029D',
                    },
                    dataSize: '0',
                    value: '0',
                    methodName: undefined,
                    isCancellation: true,
                  },
                  executionInfo: {
                    type: DetailedExecutionInfoType.MULTISIG,
                    nonce: 3,
                    confirmationsRequired: 2,
                    confirmationsSubmitted: 1,
                    missingSigners: [
                      {
                        value: '0xbc2BB26a6d821e69A38016f3858561a1D80d4182',
                      },
                    ],
                  },
                  txHash: null,
                },
                conflictType: ConflictType.NONE,
              },
            ],
          },
          loaded: true,
          loading: false,
          error: undefined,
        },
      },
    })

    expect(screen.getByText('(1) Transaction queue')).toBeInTheDocument()

    const expandBtn = screen.getByLabelText('expand transaction queue bar')
    fireEvent.click(expandBtn)

    expect(screen.getByText('On-chain rejection')).toBeInTheDocument()
  })
})
