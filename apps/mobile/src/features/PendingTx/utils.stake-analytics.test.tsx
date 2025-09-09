import React from 'react'
import { render, fireEvent, waitFor } from '@/src/tests/test-utils'
import * as firebaseAnalytics from '@/src/services/analytics/firebaseAnalytics'
import * as transactionEvents from '@/src/services/analytics/events/transactions'
import { createRenderPendingTx } from './utils'
import { TransactionInfoType, TransactionStatus } from '@safe-global/store/gateway/types'
import type { PendingTransactionItems } from '@safe-global/store/gateway/types'
import type { NativeStakingDepositTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

// Mock the router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}))

const mockStakePendingTransaction: PendingTransactionItems = {
  type: 'TRANSACTION',
  transaction: {
    id: 'pending-stake-tx-1',
    timestamp: 1234567890,
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
    txInfo: {
      type: TransactionInfoType.NATIVE_STAKING_DEPOSIT,
      humanDescription: 'Stake ETH',
      value: '1000000000000000000',
      tokenInfo: {
        type: 'NATIVE_TOKEN',
        address: '0x0000000000000000000000000000000000000000',
        name: 'Ethereum',
        symbol: 'ETH',
        decimals: 18,
        logoUri: 'https://example.com/eth.png',
      },
      validators: ['0xvalidator1'],
    } as NativeStakingDepositTransactionInfo,
    executionInfo: {
      type: 'MULTISIG',
      nonce: 1,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [{ value: '0x123' }],
    },
    safeAppInfo: null,
  },
}

const mockRegularPendingTransaction: PendingTransactionItems = {
  type: 'TRANSACTION',
  transaction: {
    id: 'pending-regular-tx-1',
    timestamp: 1234567890,
    txStatus: TransactionStatus.AWAITING_CONFIRMATIONS,
    txInfo: {
      type: TransactionInfoType.TRANSFER,
      humanDescription: 'Transfer ETH',
      sender: { value: '0x123' },
      recipient: { value: '0x456' },
      direction: 'OUTGOING',
      transferInfo: {
        type: 'NATIVE_COIN',
        value: '1000000000000000000',
      },
    },
    executionInfo: {
      type: 'MULTISIG',
      nonce: 2,
      confirmationsRequired: 2,
      confirmationsSubmitted: 1,
      missingSigners: [{ value: '0x123' }],
    },
    safeAppInfo: null,
  },
}

describe('PendingTx Utils - Stake Analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('tracks stake viewed event when pending stake transaction is clicked', async () => {
    const trackEventSpy = jest.spyOn(firebaseAnalytics, 'trackEvent').mockResolvedValue(undefined)
    const createStakeViewedEventSpy = jest.spyOn(transactionEvents, 'createStakeViewedEvent')

    const RenderPendingTx = createRenderPendingTx({
      item: mockStakePendingTransaction,
      index: 0,
    })

    render(<RenderPendingTx />)

    // Find and click the stake transaction
    const stakeTransactionElement = await waitFor(() => {
      const element = document.querySelector('[data-testid*="stake"]') || 
                     document.querySelector('text[children="Stake"]')?.parentElement
      expect(element).toBeTruthy()
      return element
    })

    fireEvent.press(stakeTransactionElement)

    await waitFor(() => {
      expect(createStakeViewedEventSpy).toHaveBeenCalledWith('Assets')
      expect(trackEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'stake_viewed',
          eventCategory: 'transactions',
          eventAction: 'Stake viewed',
          eventLabel: 'Assets',
        })
      )
    })
  })

  it('does not track stake viewed event when non-stake pending transaction is clicked', async () => {
    const trackEventSpy = jest.spyOn(firebaseAnalytics, 'trackEvent').mockResolvedValue(undefined)
    const createStakeViewedEventSpy = jest.spyOn(transactionEvents, 'createStakeViewedEvent')

    const RenderPendingTx = createRenderPendingTx({
      item: mockRegularPendingTransaction,
      index: 0,
    })

    render(<RenderPendingTx />)

    // Find and click a regular transaction
    const transactionElement = await waitFor(() => {
      const element = document.querySelector('text[children="Transfer ETH"]')?.parentElement
      expect(element).toBeTruthy()
      return element
    })

    fireEvent.press(transactionElement)

    // Wait a bit to ensure no stake event is tracked
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(createStakeViewedEventSpy).not.toHaveBeenCalled()
    // trackEvent might still be called for other events, but not for stake viewed
    if (trackEventSpy.mock.calls.length > 0) {
      expect(trackEventSpy).not.toHaveBeenCalledWith(
        expect.objectContaining({
          eventName: 'stake_viewed',
        })
      )
    }
  })

  it('handles analytics errors gracefully for pending stake transactions', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    jest.spyOn(firebaseAnalytics, 'trackEvent').mockRejectedValue(new Error('Analytics error'))

    const RenderPendingTx = createRenderPendingTx({
      item: mockStakePendingTransaction,
      index: 0,
    })

    render(<RenderPendingTx />)

    // Find and click the stake transaction
    const stakeTransactionElement = await waitFor(() => {
      const element = document.querySelector('[data-testid*="stake"]') || 
                     document.querySelector('text[children="Stake"]')?.parentElement
      expect(element).toBeTruthy()
      return element
    })

    fireEvent.press(stakeTransactionElement)

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error tracking stake viewed event:', expect.any(Error))
    })

    consoleSpy.mockRestore()
  })
})