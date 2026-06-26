import { txAiInsightsSlice, setTxAiInsight, selectTxAiInsight, buildKey } from '../txAiInsightsSlice'
import type { TxAiInsight } from '../../types'
import type { RootState } from '@/store'

const insight: TxAiInsight = {
  description: 'Sends 1 ETH to 0xabc',
  riskLevel: 'low',
  riskSummary: 'Standard native transfer to a known recipient.',
  safeTxHash: '0xhash',
  generatedAt: 1,
}

describe('txAiInsightsSlice', () => {
  it('stores an insight keyed by chainId:safeTxHash', () => {
    const state = txAiInsightsSlice.reducer(undefined, setTxAiInsight({ chainId: '1', insight }))
    expect(state[buildKey('1', '0xhash')]).toEqual(insight)
  })

  it('selects an insight by chainId + safeTxHash', () => {
    const root = { [txAiInsightsSlice.name]: { [buildKey('1', '0xhash')]: insight } } as unknown as RootState

    expect(selectTxAiInsight(root, '1', '0xhash')).toEqual(insight)
    expect(selectTxAiInsight(root, '1', '0xother')).toBeUndefined()
    expect(selectTxAiInsight(root, '5', '0xhash')).toBeUndefined()
    expect(selectTxAiInsight(root, '1', undefined)).toBeUndefined()
  })
})
