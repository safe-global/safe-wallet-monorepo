import { ZeroAddress } from 'ethers'
import { FEATURES } from '@safe-global/utils/utils/chains'
import SwapPage from '@/pages/swap'
import { mockHasFeature } from '@/tests/mocks/hooks'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'

jest.mock('@/hooks/useChains')

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: () => ({
    SwapWidget: ({ sell }: { sell?: { asset: string; amount: string } }) => (
      <div data-testid="swap-widget" data-sell-asset={sell?.asset ?? ''} data-sell-amount={sell?.amount ?? ''} />
    ),
    FallbackSwapWidget: () => <div data-testid="fallback-swap-widget" />,
  }),
}))

const COW_NATIVE_TOKEN_ADDRESS = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'

const renderSwapPage = (query: { token: string; amount: string }) => render(<SwapPage />, { routerProps: { query } })

describe('Swap page', () => {
  beforeEach(() => {
    mockHasFeature({ [FEATURES.NATIVE_SWAPS]: true, [FEATURES.NATIVE_SWAPS_COW]: true })
  })

  it('preselects the native token as the CoW native address when opened from the native asset row', () => {
    renderSwapPage({ token: ZeroAddress, amount: '0' })

    const widget = screen.getByTestId('swap-widget')
    expect(widget).toHaveAttribute('data-sell-asset', COW_NATIVE_TOKEN_ADDRESS)
    expect(widget).toHaveAttribute('data-sell-amount', '0')
  })

  it('preselects an ERC-20 token by its own address', () => {
    const token = fakerChecksummedAddress()

    renderSwapPage({ token, amount: '0' })

    expect(screen.getByTestId('swap-widget')).toHaveAttribute('data-sell-asset', token)
  })
})
