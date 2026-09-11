import type { ReactNode } from 'react'
import type Safe from '@safe-global/protocol-kit'
import type { SafeTransaction } from '@safe-global/types-kit'
import { faker } from '@faker-js/faker'
import { renderHook, waitFor } from '@/tests/test-utils'
import { createMockSafeTransaction } from '@/tests/transactions'
import { SafeTxContext, type SafeTxContextParams } from '@/components/tx-flow/SafeTxProvider'
import * as safeCoreSDK from '@/hooks/coreSDK/safeCoreSDK'
import * as executionPreChecks from '@/services/tx/executionPreChecks'
import { useValidateTxData } from '../useValidateTxData'

const SAFE_TX_HASH = `0x${'ab'.repeat(32)}`

const createWrapper = (safeTx?: SafeTransaction) => {
  const value: SafeTxContextParams = {
    safeTx,
    setSafeTx: () => {},
    setSafeMessage: () => {},
    setSafeMessageHash: () => {},
    setSafeTxError: () => {},
    setNonce: () => {},
    setNonceNeeded: () => {},
    setSafeTxGas: () => {},
    setTxOrigin: () => {},
    isReadOnly: false,
    gtfPaymentMode: 'safe',
    setGtfPaymentMode: () => {},
    setGtfSelectedGasToken: () => {},
  }
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SafeTxContext.Provider value={value}>{children}</SafeTxContext.Provider>
  }
}

describe('useValidateTxData', () => {
  const safeTx = createMockSafeTransaction({ to: faker.finance.ethereumAddress(), data: '0x' })
  let validateTxSignaturesSpy: jest.SpyInstance

  beforeEach(() => {
    jest.resetAllMocks()

    jest.spyOn(safeCoreSDK, 'useSafeSDK').mockReturnValue({
      getTransactionHash: jest.fn().mockResolvedValue(SAFE_TX_HASH),
    } as unknown as Safe)

    validateTxSignaturesSpy = jest.spyOn(executionPreChecks, 'validateTxSignatures').mockReturnValue(undefined)
  })

  it('returns undefined while the SDK is not initialized', async () => {
    jest.spyOn(safeCoreSDK, 'useSafeSDK').mockReturnValue(undefined)

    const { result } = renderHook(() => useValidateTxData(), { wrapper: createWrapper(safeTx) })

    await waitFor(() => {
      expect(result.current).toEqual([undefined, undefined, false])
    })
    expect(validateTxSignaturesSpy).not.toHaveBeenCalled()
  })

  it('returns undefined when there is no safeTx in the context', async () => {
    const { result } = renderHook(() => useValidateTxData(), { wrapper: createWrapper(undefined) })

    await waitFor(() => {
      expect(result.current).toEqual([undefined, undefined, false])
    })
    expect(validateTxSignaturesSpy).not.toHaveBeenCalled()
  })

  it('returns an error message when the txId does not match the computed safeTxHash', async () => {
    const txId = `multisig_0x123_0x${'ff'.repeat(32)}`

    const { result } = renderHook(() => useValidateTxData(txId), { wrapper: createWrapper(safeTx) })

    await waitFor(() => {
      expect(result.current[0]).toBe('The transaction data does not match its safeTxHash')
      expect(result.current[2]).toBe(false)
    })
    expect(validateTxSignaturesSpy).not.toHaveBeenCalled()
  })

  it('validates signatures when the txId matches the computed safeTxHash', async () => {
    const txId = `multisig_0x123_${SAFE_TX_HASH}`

    const { result } = renderHook(() => useValidateTxData(txId), { wrapper: createWrapper(safeTx) })

    await waitFor(() => {
      expect(result.current).toEqual([undefined, undefined, false])
    })
    expect(validateTxSignaturesSpy).toHaveBeenCalledWith(safeTx, SAFE_TX_HASH)
  })

  it('returns the signature validation message when a signature does not verify', async () => {
    const badSignatureMessage = 'Could not verify your signature. Sign the transaction again.'
    validateTxSignaturesSpy.mockReturnValue(badSignatureMessage)

    const { result } = renderHook(() => useValidateTxData(), { wrapper: createWrapper(safeTx) })

    await waitFor(() => {
      expect(result.current[0]).toBe(badSignatureMessage)
      expect(result.current[2]).toBe(false)
    })
    expect(validateTxSignaturesSpy).toHaveBeenCalledWith(safeTx, SAFE_TX_HASH)
  })

  it('validates signatures without a txId', async () => {
    const { result } = renderHook(() => useValidateTxData(), { wrapper: createWrapper(safeTx) })

    await waitFor(() => {
      expect(result.current).toEqual([undefined, undefined, false])
    })
    expect(validateTxSignaturesSpy).toHaveBeenCalledWith(safeTx, SAFE_TX_HASH)
  })
})
