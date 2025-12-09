import { render } from '@/src/tests/test-utils'
import { BalanceChangeItem } from './BalanceChangeItem'
import type { BalanceChangeDto } from '@safe-global/store/gateway/AUTO_GENERATED/safe-shield'

const ethAsset: BalanceChangeDto['asset'] = {
  type: 'NATIVE',
  symbol: 'ETH',
  logo_url: 'https://example.com/eth.png',
}

const usdcAsset: BalanceChangeDto['asset'] = {
  type: 'ERC20',
  symbol: 'USDC',
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  logo_url: 'https://example.com/usdc.png',
}

const nftAsset: BalanceChangeDto['asset'] = {
  type: 'ERC721',
  symbol: 'BAYC',
  address: '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D',
}

const erc1155Asset: BalanceChangeDto['asset'] = {
  type: 'ERC1155',
  symbol: 'ITEM',
  address: '0x1234567890123456789012345678901234567890',
}

const tokenWithoutSymbol: BalanceChangeDto['asset'] = {
  type: 'ERC20',
  address: '0xABCDEF1234567890ABCDEF1234567890ABCDEF12',
}

describe('BalanceChangeItem', () => {
  describe('Asset symbol display', () => {
    it('should render native asset symbol', () => {
      const { getByText } = render(<BalanceChangeItem asset={ethAsset} diff={{ value: '1' }} />)
      expect(getByText('ETH')).toBeTruthy()
    })

    it('should render ERC20 token symbol', () => {
      const { getByText } = render(<BalanceChangeItem asset={usdcAsset} diff={{ value: '100' }} />)
      expect(getByText('USDC')).toBeTruthy()
    })

    it('should render NFT symbol', () => {
      const { getByText } = render(<BalanceChangeItem asset={nftAsset} diff={{ token_id: 123 }} />)
      expect(getByText('BAYC')).toBeTruthy()
    })

    it('should render truncated address when token has no symbol', () => {
      const { getByText } = render(<BalanceChangeItem asset={tokenWithoutSymbol} diff={{ value: '50' }} />)
      expect(getByText(/0xABCD/i)).toBeTruthy()
    })
  })

  describe('Asset type label', () => {
    it('should render "Native" for native asset', () => {
      const { getByText } = render(<BalanceChangeItem asset={ethAsset} diff={{ value: '1' }} />)
      expect(getByText('Native')).toBeTruthy()
    })

    it('should render "ERC20" for ERC20 token', () => {
      const { getByText } = render(<BalanceChangeItem asset={usdcAsset} diff={{ value: '100' }} />)
      expect(getByText('ERC20')).toBeTruthy()
    })

    it('should render "NFT" for ERC721 token', () => {
      const { getByText } = render(<BalanceChangeItem asset={nftAsset} diff={{ token_id: 123 }} />)
      expect(getByText('NFT')).toBeTruthy()
    })

    it('should render "NFT" for ERC1155 token', () => {
      const { getByText } = render(<BalanceChangeItem asset={erc1155Asset} diff={{ token_id: 456 }} />)
      expect(getByText('NFT')).toBeTruthy()
    })
  })

  describe('Value display', () => {
    it('should render negative value for outgoing fungible transfer', () => {
      const { getByText } = render(<BalanceChangeItem asset={ethAsset} diff={{ value: '0.05' }} positive={false} />)
      expect(getByText('-0.05')).toBeTruthy()
    })

    it('should render positive value for incoming fungible transfer', () => {
      const { getByText } = render(<BalanceChangeItem asset={usdcAsset} diff={{ value: '1000' }} positive={true} />)
      expect(getByText('+1,000')).toBeTruthy()
    })

    it('should render token ID for NFT transfer', () => {
      const { getByText } = render(<BalanceChangeItem asset={nftAsset} diff={{ token_id: 1234 }} />)
      expect(getByText('#1234')).toBeTruthy()
    })

    it('should render "unknown" when value is undefined', () => {
      const { getByText } = render(<BalanceChangeItem asset={ethAsset} diff={{}} />)
      expect(getByText('unknown')).toBeTruthy()
    })

    it('should format large numbers with commas', () => {
      const { getByText } = render(<BalanceChangeItem asset={usdcAsset} diff={{ value: '1000000' }} positive={true} />)
      expect(getByText('+1,000,000')).toBeTruthy()
    })
  })

  describe('Default props', () => {
    it('should default to negative (outgoing) when positive prop not provided', () => {
      const { getByText } = render(<BalanceChangeItem asset={ethAsset} diff={{ value: '1' }} />)
      expect(getByText('-1')).toBeTruthy()
    })
  })
})
