import { FEATURES } from '@safe-global/utils/utils/chains'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { mockCurrentChain, mockHasFeature } from '@/tests/mocks/hooks'
import { Bridge } from '.'

jest.mock('@/hooks/useChains')
jest.mock('@/components/safe-apps/AppFrame', () => ({
  __esModule: true,
  default: ({ appUrl }: { appUrl: string }) => <iframe title="Bridge" src={appUrl} />,
}))

describe('Bridge', () => {
  it('embeds the LI.FI bridge app once the user accepts the disclaimer', () => {
    const chain = mockCurrentChain({ features: [FEATURES.BRIDGE] })
    mockHasFeature(true)

    render(<Bridge />)

    expect(screen.getByText(/Bridging Widget by LI.FI/)).toBeInTheDocument()
    expect(screen.queryByTitle('Bridge')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }))

    expect(screen.getByTitle('Bridge')).toHaveAttribute('src', expect.stringContaining(`fromChain=${chain.chainId}`))
  })
})
