import { buildTxAiInsightRequest } from '../buildTxAiInsightRequest'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TransactionPreview } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'

const safeTxData = { to: '0xTo', value: '0', data: '0xabc', operation: 0, nonce: 5 } as SafeTransaction['data']

describe('buildTxAiInsightRequest', () => {
  it('maps safeTxData and the decoded preview into the request', () => {
    const txPreview = {
      txData: { dataDecoded: { method: 'transfer', parameters: [{ name: 'to' }] } },
    } as unknown as TransactionPreview

    const req = buildTxAiInsightRequest({
      chainId: '1',
      safeAddress: '0xSafe',
      safeTxHash: '0xhash',
      safeTxData,
      txPreview,
    })

    expect(req).toEqual({
      chainId: '1',
      safeAddress: '0xSafe',
      safeTxHash: '0xhash',
      nonce: 5,
      transaction: { to: '0xTo', value: '0', data: '0xabc', operation: 0 },
      decoded: { method: 'transfer', parameters: [{ name: 'to' }] },
    })
  })

  it('sets decoded to null when there is no decoded data', () => {
    const req = buildTxAiInsightRequest({
      chainId: '1',
      safeAddress: '0xSafe',
      safeTxHash: '0xhash',
      safeTxData,
      txPreview: undefined,
    })

    expect(req.decoded).toBeNull()
  })
})
