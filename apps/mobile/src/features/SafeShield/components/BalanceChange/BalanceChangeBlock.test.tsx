import { render } from '@/src/tests/test-utils'
import { BalanceChangeBlock } from './BalanceChangeBlock'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import type { BalanceChangeDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

const createThreatResult = (balanceChanges: BalanceChangeDto[]): AsyncResult<ThreatAnalysisResults> => {
  return [{ BALANCE_CHANGE: balanceChanges }, undefined, false]
}

const ethAsset: BalanceChangeDto['asset'] = {
  type: 'NATIVE',
  symbol: 'ETH',
  logo_url: 'https://example.com/eth.png',
}

const usdcAsset: BalanceChangeDto['asset'] = {
  type: 'ERC20',
  symbol: 'USDC',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
}

describe('BalanceChangeBlock', () => {
  describe('Header', () => {
    it('should render "Balance change" header', () => {
      const { getByText } = render(<BalanceChangeBlock />)
      expect(getByText('Balance change')).toBeTruthy()
    })
  })

  describe('Loading state', () => {
    it('should render skeleton when loading', () => {
      const loadingThreat: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, true]
      const { queryByText } = render(<BalanceChangeBlock threat={loadingThreat} />)

      expect(queryByText('No balance change detected')).toBeNull()
      expect(queryByText('Could not calculate balance changes.')).toBeNull()
    })
  })

  describe('Error state', () => {
    it('should render error message when threat analysis fails', () => {
      const errorThreat: AsyncResult<ThreatAnalysisResults> = [undefined, new Error('Failed'), false]
      const { getByText } = render(<BalanceChangeBlock threat={errorThreat} />)

      expect(getByText('Could not calculate balance changes.')).toBeTruthy()
    })
  })

  describe('Empty state', () => {
    it('should render "No balance change detected" when no changes', () => {
      const emptyThreat = createThreatResult([])
      const { getByText } = render(<BalanceChangeBlock threat={emptyThreat} />)

      expect(getByText('No balance change detected')).toBeTruthy()
    })

    it('should render "No balance change detected" when threat is undefined', () => {
      const { getByText } = render(<BalanceChangeBlock />)

      expect(getByText('No balance change detected')).toBeTruthy()
    })

    it('should render "No balance change detected" when balance change has empty in/out arrays', () => {
      const emptyChangeThreat = createThreatResult([{ asset: ethAsset, in: [], out: [] }])
      const { getByText } = render(<BalanceChangeBlock threat={emptyChangeThreat} />)

      expect(getByText('No balance change detected')).toBeTruthy()
    })
  })

  describe('Balance changes display', () => {
    it('should render outgoing ETH balance change', () => {
      const threat = createThreatResult([
        {
          asset: ethAsset,
          in: [],
          out: [{ value: '0.05' }],
        },
      ])
      const { getByText } = render(<BalanceChangeBlock threat={threat} />)

      expect(getByText('ETH')).toBeTruthy()
      expect(getByText('Native')).toBeTruthy()
    })

    it('should render incoming token balance change', () => {
      const threat = createThreatResult([
        {
          asset: usdcAsset,
          in: [{ value: '1000' }],
          out: [],
        },
      ])
      const { getByText } = render(<BalanceChangeBlock threat={threat} />)

      expect(getByText('USDC')).toBeTruthy()
      expect(getByText('ERC20')).toBeTruthy()
    })

    it('should render multiple balance changes', () => {
      const threat = createThreatResult([
        {
          asset: ethAsset,
          in: [],
          out: [{ value: '1' }],
        },
        {
          asset: usdcAsset,
          in: [{ value: '2500' }],
          out: [],
        },
      ])
      const { getByText } = render(<BalanceChangeBlock threat={threat} />)

      expect(getByText('ETH')).toBeTruthy()
      expect(getByText('USDC')).toBeTruthy()
    })

    it('should render NFT balance change', () => {
      const nftAsset: BalanceChangeDto['asset'] = {
        type: 'ERC721',
        symbol: 'BAYC',
        address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
      }
      const threat = createThreatResult([
        {
          asset: nftAsset,
          in: [],
          out: [{ token_id: 1234 }],
        },
      ])
      const { getByText } = render(<BalanceChangeBlock threat={threat} />)

      expect(getByText('BAYC')).toBeTruthy()
      expect(getByText('NFT')).toBeTruthy()
      expect(getByText('#1234')).toBeTruthy()
    })
  })

  describe('testID', () => {
    it('should have balance-change-block testID', () => {
      const { getByTestId } = render(<BalanceChangeBlock />)
      expect(getByTestId('balance-change-block')).toBeTruthy()
    })
  })
})
