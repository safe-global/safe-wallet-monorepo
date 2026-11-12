import { act, renderHook } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { usePortfolioClearPortfolioV1Mutation } from '@safe-global/store/gateway/AUTO_GENERATED/portfolios'
import { chainBuilder } from '@/tests/builders/chains'
import useChains from '@/hooks/useChains'
import { TxEvent, txDispatch } from '@/services/tx/txEvents'
import useClearPortfolioOnTx from '../useClearPortfolioOnTx'

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/portfolios', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/portfolios'),
  usePortfolioClearPortfolioV1Mutation: jest.fn(),
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const SAFE = '0x1111111111111111111111111111111111111111'

const dispatchSuccess = (chainId: string) =>
  act(() => {
    txDispatch(TxEvent.SUCCESS, { chainId, safeAddress: SAFE, txId: 'tx', groupKey: 'group' })
  })

describe('useClearPortfolioOnTx', () => {
  const clearPortfolio = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    ;(usePortfolioClearPortfolioV1Mutation as jest.Mock).mockReturnValue([clearPortfolio])
    ;(useChains as jest.Mock).mockReturnValue({
      configs: [
        chainBuilder()
          .with({ chainId: '1', features: [FEATURES.PORTFOLIO_SUMMARIES] })
          .build(),
        chainBuilder().with({ chainId: '137', features: [] }).build(),
      ],
    })
  })

  it('clears the portfolio of the Safe whose tx executed on a summaries chain', () => {
    renderHook(() => useClearPortfolioOnTx())

    dispatchSuccess('1')

    expect(clearPortfolio).toHaveBeenCalledWith({ address: SAFE, chainId: '1' })
  })

  it('does nothing on a chain without a summaries flag', () => {
    renderHook(() => useClearPortfolioOnTx())

    dispatchSuccess('137')

    expect(clearPortfolio).not.toHaveBeenCalled()
  })

  it('stops listening after unmount', () => {
    const { unmount } = renderHook(() => useClearPortfolioOnTx())
    unmount()

    dispatchSuccess('1')

    expect(clearPortfolio).not.toHaveBeenCalled()
  })
})
