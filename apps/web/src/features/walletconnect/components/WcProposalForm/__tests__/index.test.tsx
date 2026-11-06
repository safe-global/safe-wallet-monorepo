import { fireEvent, render, screen } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { sessionProposalBuilder } from '@/tests/builders/walletConnect'
import WcProposalForm from '../index'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [chainBuilder().with({ chainId: '1' }).build()] }),
  useCurrentChain: () => undefined,
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: () => ({ safe: { chainId: '1' }, safeLoaded: true }),
}))

jest.mock('@/hooks/useSanctionedAddress', () => ({
  useSanctionedAddress: () => null,
}))

const renderForm = (proposal = sessionProposalBuilder()) =>
  render(<WcProposalForm proposal={proposal} onApprove={jest.fn()} onReject={jest.fn()} />)

describe('WcProposalForm', () => {
  it('allows approving a verified dApp', () => {
    renderForm()

    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
  })

  it('blocks approving a scam', () => {
    renderForm(sessionProposalBuilder({ isScam: true }))

    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
  })

  it('requires a risk acknowledgement for a warned bridge', () => {
    renderForm(sessionProposalBuilder({ origin: 'https://bridge.arbitrum.io' }))

    expect(screen.getByRole('button', { name: 'Approve' })).toBeDisabled()
    fireEvent.click(screen.getByRole('checkbox'))
    expect(screen.getByRole('button', { name: 'Approve' })).toBeEnabled()
  })

  it('offers only closing on a chain the dApp does not support', () => {
    renderForm(sessionProposalBuilder({ chains: ['eip155:137'] }))

    expect(screen.queryByRole('button', { name: 'Approve' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })
})
