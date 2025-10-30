import { renderHook, waitFor } from '@/tests/test-utils'
import useTxDetails from '@/hooks/useTxDetails'
import * as useChainId from '@/hooks/useChainId'
import { http, HttpResponse } from 'msw'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { faker } from '@faker-js/faker'

describe('useTxDetails hook', () => {
  const chainId = '1'
  const txId = faker.string.hexadecimal({ length: 66, prefix: '0x' })

  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(useChainId, 'default').mockReturnValue(chainId)
  })

  it('should fetch transaction details successfully', async () => {
    const mockTxDetails: TransactionDetails = {
      txInfo: {
        type: 'Transfer',
        sender: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Sender',
          logoUri: null,
        },
        recipient: {
          value: '0x0987654321098765432109876543210987654321',
          name: 'Recipient',
          logoUri: null,
        },
        direction: 'OUTGOING',
        transferInfo: {
          type: 'NATIVE_COIN',
          value: '1000000000000000000',
        },
      },
      safeAddress: '0x123',
      txId,
      txStatus: 'SUCCESS',
      executedAt: 1234567890,
    }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, ({ params }) => {
        if (params.chainId === chainId && params.id === txId) {
          return HttpResponse.json(mockTxDetails)
        }
        return HttpResponse.json(null, { status: 404 })
      }),
    )

    const { result } = renderHook(() => useTxDetails(txId))

    // Initially should be loading
    expect(result.current[2]).toBe(true) // isLoading

    // Wait for data to be fetched
    await waitFor(() => {
      expect(result.current[2]).toBe(false) // isLoading should be false
    })

    const [txDetails, error] = result.current

    // Verify data was fetched
    expect(txDetails).toBeDefined()
    expect((txDetails as TransactionDetails).txId).toBe(txId)
    expect((txDetails as TransactionDetails).txStatus).toBe('SUCCESS')
    expect(error).toBeUndefined()
  })

  it('should skip query when txId is not provided', () => {
    const { result } = renderHook(() => useTxDetails(undefined))

    // Should return early with no loading state
    expect(result.current[2]).toBe(false) // isLoading should be false
    expect(result.current[0]).toBeUndefined() // data should be undefined
    expect(result.current[1]).toBeUndefined() // error should be undefined
  })

  it('should skip query when chainId is not available', () => {
    jest.spyOn(useChainId, 'default').mockReturnValue('')

    const { result } = renderHook(() => useTxDetails(txId))

    expect(result.current[2]).toBe(false) // isLoading should be false
    expect(result.current[0]).toBeUndefined() // data should be undefined
  })

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => {
        return HttpResponse.error()
      }),
    )

    const { result } = renderHook(() => useTxDetails(txId))

    await waitFor(() => {
      expect(result.current[2]).toBe(false) // isLoading should be false
    })

    const [txDetails, error] = result.current

    // Data should be undefined on error
    expect(txDetails).toBeUndefined()
    expect(error).toBeDefined()
  })

  it('should return data in tuple format compatible with destructuring', async () => {
    const mockTxDetails: TransactionDetails = {
      txInfo: {
        type: 'Custom',
        to: {
          value: '0x1234567890123456789012345678901234567890',
          name: 'Contract',
          logoUri: null,
        },
        dataSize: '100',
        value: null,
        isCancellation: false,
        methodName: 'transfer',
      },
      safeAddress: '0x123',
      txId,
      txStatus: 'AWAITING_CONFIRMATIONS',
    }

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => {
        return HttpResponse.json(mockTxDetails)
      }),
    )

    const { result } = renderHook(() => useTxDetails(txId))

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    // Should be destructurable as [data, error, isLoading]
    const [data, error, isLoading] = result.current

    expect(data).toBeDefined()
    expect(error).toBeUndefined()
    expect(isLoading).toBe(false)
  })

  it('should refetch when txId changes', async () => {
    let callCount = 0

    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, ({ params }) => {
        callCount++
        return HttpResponse.json({
          txInfo: { type: 'Custom', to: { value: '0x1' } },
          safeAddress: '0x123',
          txId: params.id as string,
          txStatus: 'SUCCESS' as const,
        })
      }),
    )

    const { result, rerender } = renderHook(({ id }: { id?: string }) => useTxDetails(id), {
      initialProps: { id: txId },
    })

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    const firstCallCount = callCount

    // Change txId
    const newTxId = faker.string.hexadecimal({ length: 66, prefix: '0x' })
    rerender({ id: newTxId })

    await waitFor(() => {
      expect(result.current[2]).toBe(false)
    })

    // Should have made additional API calls
    expect(callCount).toBeGreaterThan(firstCallCount)
  })
})
