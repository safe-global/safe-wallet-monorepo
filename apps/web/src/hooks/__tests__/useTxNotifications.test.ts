import type { DmkError } from '@ledgerhq/device-management-kit'

import { renderHook, waitFor } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { showNotification } from '@/store/notificationsSlice'
import { txDispatch, TxEvent } from '@/services/tx/txEvents'
import { mapLedgerError } from '@/services/onboard/ledger-errors'
import useTxNotifications from '../useTxNotifications'

jest.mock('@/store/notificationsSlice', () => {
  const original = jest.requireActual('@/store/notificationsSlice')
  return {
    ...original,
    showNotification: jest.fn(original.showNotification),
  }
})

const MOCK_CHAIN = chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build()

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => MOCK_CHAIN),
}))

jest.mock('@/hooks/useTxQueue', () => ({
  __esModule: true,
  default: jest.fn(() => ({ page: undefined })),
}))

jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => null),
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  __esModule: true,
  useLazyTransactionsGetTransactionByIdV1Query: jest.fn(() => [jest.fn(() => Promise.resolve({ data: undefined }))]),
}))

/** The ethers error the Ledger module rejects with, as viem re-wraps it. */
const ledgerSignError = (error: DmkError): Error => {
  const cause = mapLedgerError(error)
  return Object.assign(
    new Error(`An unknown RPC error occurred.\n\nDetails: ${cause.message}\n\nVersion: viem@2.52.2`),
    { cause },
  )
}

const lastNotification = () => {
  const calls = (showNotification as unknown as jest.Mock).mock.calls
  return calls[calls.length - 1]?.[0]
}

describe('useTxNotifications', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('shows the generic failure message, with raw details, for an ordinary error', () => {
    renderHook(() => useTxNotifications())

    txDispatch(TxEvent.SIGN_FAILED, { error: new Error('HTTP request failed. Status: 500') })

    expect(lastNotification()).toMatchObject({
      message: 'Failed to sign. Please try again. ',
      detailedMessage: 'HTTP request failed. Status: 500',
      variant: 'error',
    })
  })

  it('translates a Ledger device failure into what the device asked for', () => {
    renderHook(() => useTxNotifications())

    txDispatch(TxEvent.SIGN_FAILED, {
      error: ledgerSignError({
        _tag: 'DeviceLockedError',
        errorCode: '5515',
        message: 'Device is locked.',
      } as DmkError),
    })

    expect(lastNotification()).toMatchObject({
      message: 'Unlock your Ledger and try again.',
      variant: 'error',
    })
  })

  it('withholds the raw payload of a Ledger failure from the Details pane', () => {
    renderHook(() => useTxNotifications())

    // The shape from the bug report: no message, the reason wrapped in an Error.
    txDispatch(TxEvent.SIGN_FAILED, {
      error: ledgerSignError({ _tag: 'InvalidStatusWordError', originalError: new Error('no signature returned') }),
    })

    const notification = lastNotification()

    expect(notification.message).toBe('Your Ledger could not complete the request.')
    // `detailedMessage` is rendered verbatim in a <pre> — this is the surface
    // that leaked "code=UNKNOWN_ERROR ... Version: viem@2.52.2" (WA-3243).
    expect(notification.detailedMessage).toBeUndefined()

    for (const forbidden of ['viem@', 'version=', 'InvalidStatusWordError', 'UNKNOWN_ERROR', 'info={']) {
      expect(JSON.stringify(notification)).not.toContain(forbidden)
    }
  })

  it('stays silent when the user cancels on the device', () => {
    renderHook(() => useTxNotifications())

    txDispatch(TxEvent.SIGN_FAILED, {
      error: ledgerSignError({
        _tag: 'EthAppCommandError',
        errorCode: '6985',
        message: 'Condition not satisfied',
      } as DmkError),
    })

    expect(showNotification).not.toHaveBeenCalled()
  })

  it('keeps the mined-revert message ahead of every other classification', async () => {
    renderHook(() => useTxNotifications())

    txDispatch(TxEvent.REVERTED, {
      txId: '0x1',
      groupKey: '0x1',
      chainId: '1',
      safeAddress: '0x0000000000000000000000000000000000000001',
      error: new Error('reverted'),
    })

    // A notification carrying a txId resolves the human description first.
    await waitFor(() =>
      expect(lastNotification()).toMatchObject({
        message: 'Transaction reverted on Ethereum. Gas was spent.',
      }),
    )
  })
})
