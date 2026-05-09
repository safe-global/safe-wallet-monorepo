import { http, HttpResponse } from 'msw'
import type { TransactionDetails, QueuedItemPage } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

/**
 * Transaction-related MSW handlers for Storybook stories
 */
export const createTransactionHandlers = (GATEWAY_URL: string) => [
  // Transaction details endpoint
  http.get<{ chainId: string; id: string }, never, TransactionDetails>(
    `${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`,
    () => {
      return HttpResponse.json({
        txInfo: {
          type: 'Custom',
          to: {
            value: '0x1234567890123456789012345678901234567890',
            name: 'Test Contract',
            logoUri: null,
          },
          dataSize: '100',
          value: '1000000000000000000',
          isCancellation: false,
          methodName: 'transfer',
        },
        safeAddress: '0x1234567890123456789012345678901234567890',
        txId: 'multisig_0x123_0xabc',
        txStatus: 'AWAITING_CONFIRMATIONS' as const,
        executedAt: null,
        txHash: null,
      })
    },
  ),

  // Transaction queue endpoint
  http.get<{ chainId: string; safeAddress: string }, never, QueuedItemPage>(
    `${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/queued`,
    () => {
      return HttpResponse.json({
        count: 2,
        next: null,
        previous: null,
        results: [],
      })
    },
  ),

  // Transaction history endpoint
  http.get(`${GATEWAY_URL}/v1/chains/:chainId/safes/:safeAddress/transactions/history`, () => {
    return HttpResponse.json({
      count: 0,
      next: null,
      previous: null,
      results: [],
    })
  }),

  // Transaction confirmation endpoint
  http.post<{ chainId: string; safeTxHash: string }, { signature: string }>(
    `${GATEWAY_URL}/v1/chains/:chainId/transactions/:safeTxHash/confirmations`,
    async ({ request }) => {
      const body = await request.json()
      return HttpResponse.json({ signature: body.signature }, { status: 201 })
    },
  ),

  // Data decoder endpoint
  http.post(`${GATEWAY_URL}/v1/chains/:chainId/data-decoder`, () => {
    return HttpResponse.json({
      method: 'transfer',
      parameters: [
        { name: 'to', type: 'address', value: '0x1234567890123456789012345678901234567890' },
        { name: 'value', type: 'uint256', value: '1000000000000000000' },
      ],
    })
  }),
]
