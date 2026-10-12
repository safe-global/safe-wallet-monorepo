import { render, screen } from '@/tests/test-utils'
import { erc20TokenBuilder, nativeTokenBuilder } from '@/tests/builders/balances'
import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'
import { PromoButtons } from './PromoButtons'

const MAINNET = '1'
const CHAIN_WITHOUT_SAFE_TOKEN = '137'

jest.mock('./SafenetStakeButton', () => ({
  __esModule: true,
  default: () => <button data-testid="safenet-stake-btn">Go to Safenet staking</button>,
}))

const mockIsEligibleEarnToken = jest.fn()
jest.mock('@/features/earn', () => ({
  EarnButton: () => <button data-testid="earn-btn">Earn</button>,
  isEligibleEarnToken: (...args: unknown[]) => mockIsEligibleEarnToken(...args),
}))

const safeToken = (chainId: string) => erc20TokenBuilder().with({ address: SAFE_TOKEN_ADDRESSES[chainId] }).build()

describe('PromoButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsEligibleEarnToken.mockReturnValue(false)
  })

  it('shows the Safenet staking button on the SAFE row', () => {
    render(
      <PromoButtons
        tokenInfo={safeToken(MAINNET)}
        chainId={MAINNET}
        isSafenetStakingEnabled
        isEarnPromoEnabled={false}
      />,
    )

    expect(screen.getByTestId('safenet-stake-btn')).toBeInTheDocument()
  })

  it('matches the SAFE token address case-insensitively', () => {
    const lowercased = erc20TokenBuilder().with({ address: SAFE_TOKEN_ADDRESSES[MAINNET].toLowerCase() }).build()

    render(<PromoButtons tokenInfo={lowercased} chainId={MAINNET} isSafenetStakingEnabled isEarnPromoEnabled={false} />)

    expect(screen.getByTestId('safenet-stake-btn')).toBeInTheDocument()
  })

  it('hides the Safenet staking button when Safenet staking is unavailable', () => {
    const { container } = render(
      <PromoButtons
        tokenInfo={safeToken(MAINNET)}
        chainId={MAINNET}
        isSafenetStakingEnabled={false}
        isEarnPromoEnabled={false}
      />,
    )

    expect(screen.queryByTestId('safenet-stake-btn')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing on a chain that has no SAFE token', () => {
    const { container } = render(
      <PromoButtons
        tokenInfo={erc20TokenBuilder().build()}
        chainId={CHAIN_WITHOUT_SAFE_TOKEN}
        isSafenetStakingEnabled
        isEarnPromoEnabled={false}
      />,
    )

    expect(screen.queryByTestId('safenet-stake-btn')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing on a non-SAFE ERC-20 row', () => {
    const { container } = render(
      <PromoButtons
        tokenInfo={erc20TokenBuilder().build()}
        chainId={MAINNET}
        isSafenetStakingEnabled
        isEarnPromoEnabled={false}
      />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('no longer renders a staking button on the native token row', () => {
    const { container } = render(
      <PromoButtons
        tokenInfo={nativeTokenBuilder().build()}
        chainId={MAINNET}
        isSafenetStakingEnabled
        isEarnPromoEnabled={false}
      />,
    )

    expect(screen.queryByTestId('stake-btn')).not.toBeInTheDocument()
    expect(container).toBeEmptyDOMElement()
  })

  it('still renders the earn button for an eligible token', () => {
    mockIsEligibleEarnToken.mockReturnValue(true)
    const token = erc20TokenBuilder().build()

    render(<PromoButtons tokenInfo={token} chainId={MAINNET} isSafenetStakingEnabled={false} isEarnPromoEnabled />)

    expect(screen.getByTestId('earn-btn')).toBeInTheDocument()
    expect(mockIsEligibleEarnToken).toHaveBeenCalledWith(MAINNET, token.address)
  })

  it('renders both buttons when the SAFE token is also earn-eligible', () => {
    mockIsEligibleEarnToken.mockReturnValue(true)

    render(<PromoButtons tokenInfo={safeToken(MAINNET)} chainId={MAINNET} isSafenetStakingEnabled isEarnPromoEnabled />)

    expect(screen.getByTestId('safenet-stake-btn')).toBeInTheDocument()
    expect(screen.getByTestId('earn-btn')).toBeInTheDocument()
  })
})
