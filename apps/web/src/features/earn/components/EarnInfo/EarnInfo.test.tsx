import { render, screen } from '@/tests/test-utils'
import * as useBalancesModule from '@/hooks/useBalances'
import useChainId from '@/hooks/useChainId'
import { balanceBuilder, balancesBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import EarnInfo from '.'

jest.mock('@/hooks/useBalances')
jest.mock('@/hooks/useChainId', () => jest.fn())

const mockUseBalances = useBalancesModule.default as jest.Mock
const mockUseChainId = useChainId as jest.Mock

const MAINNET_USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const SEPOLIA_CHAIN_ID = '11155111'

const mockBalances = (tokenAddress: string) => {
  mockUseBalances.mockReturnValue({
    balances: balancesBuilder()
      .with({
        items: [
          balanceBuilder()
            .with({ tokenInfo: erc20TokenBuilder().with({ address: tokenAddress, symbol: 'USDC' }).build() })
            .build(),
        ],
      })
      .build(),
    loaded: true,
    loading: false,
  })
}

describe('EarnInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('lists the eligible assets on a supported chain', () => {
    mockUseChainId.mockReturnValue('1')
    mockBalances(MAINNET_USDC)

    render(<EarnInfo onGetStarted={jest.fn()} />)

    expect(screen.getByText('Eligible assets')).toBeInTheDocument()
    expect(screen.getByText('Up to 3.78%*')).toBeInTheDocument()
  })

  it('renders without eligible assets on a chain with no Earn token list', () => {
    mockUseChainId.mockReturnValue(SEPOLIA_CHAIN_ID)
    mockBalances(MAINNET_USDC)

    render(<EarnInfo onGetStarted={jest.fn()} />)

    expect(screen.getByRole('button', { name: 'Get started' })).toBeInTheDocument()
    expect(screen.queryByText('Eligible assets')).not.toBeInTheDocument()
  })
})
