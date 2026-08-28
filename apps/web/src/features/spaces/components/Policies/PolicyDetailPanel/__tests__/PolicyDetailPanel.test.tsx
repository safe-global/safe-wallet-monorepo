import { fireEvent, render, screen, within } from '@/tests/test-utils'
import {
  asActivePolicy,
  mockMultiSpenderPolicy,
  mockPendingPolicy,
  mockProposerPolicy,
  mockRecoveryPolicy,
  mockSpendingLimitPolicy,
  mockUnenforcedPolicy,
} from '../../mocks/policies'
import PolicyDetailPanel from '../index'

describe('PolicyDetailPanel', () => {
  it('should, when no policy is selected, render nothing', () => {
    render(<PolicyDetailPanel policy={null} onClose={jest.fn()} />)

    expect(screen.queryByTestId('policy-detail-panel')).not.toBeInTheDocument()
  })

  it('should, when a spending limit is selected, render the panel with its derived title and status', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} />)

    expect(screen.getByTestId('policy-detail-panel')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Spending limit' })).toBeInTheDocument()
    expect(screen.getByTestId('policy-status-active')).toBeInTheDocument()
  })

  it('should, when a recovery is selected, title the panel Account recovery', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockRecoveryPolicy())} onClose={jest.fn()} />)

    expect(screen.getByRole('heading', { name: 'Account recovery' })).toBeInTheDocument()
  })

  it('should, when the close control is used, ask the caller to close the panel', () => {
    const onClose = jest.fn()

    render(<PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: /close/i }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should, when a policy is selected, state the Safe it applies to and the chain it runs on', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} />)

    expect(screen.getByTestId('policy-meta-Applies to')).toBeInTheDocument()
    expect(screen.getByTestId('policy-meta-Network')).toBeInTheDocument()
  })

  it('should, when a policy is selected, render who created it and when, naming the timezone', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} />)

    expect(screen.getByTestId('policy-meta-Created by')).toBeInTheDocument()
    expect(screen.getByTestId('policy-meta-Creation time')).toHaveTextContent('06.09.26 10:15 AM UTC')
  })

  it('should, when a spending limit holds three spenders, list each spender with its own tokens', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockMultiSpenderPolicy())} onClose={jest.fn()} />)

    const spenders = screen.getAllByTestId('policy-spender')

    expect(spenders).toHaveLength(3)
    expect(screen.getAllByTestId('policy-allowance')).toHaveLength(4)
    expect(within(spenders[0]).getByText('1,500 USDC / month')).toBeInTheDocument()
  })

  it('should, when a spending limit holds three spenders, number the spender blocks', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockMultiSpenderPolicy())} onClose={jest.fn()} />)

    expect(screen.getByText('Spender 1')).toBeInTheDocument()
    expect(screen.getByText('Spender 2')).toBeInTheDocument()
    expect(screen.getByText('Spender 3')).toBeInTheDocument()
  })

  it('should, when the policy governs no tokens, render no limits section', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockProposerPolicy())} onClose={jest.fn()} />)

    expect(screen.queryByTestId('policy-limits')).not.toBeInTheDocument()
  })

  it('should, when a token has no logo, still render its symbol and amount', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockMultiSpenderPolicy())} onClose={jest.fn()} />)

    expect(screen.getByText('UNKNOWN')).toBeInTheDocument()
    expect(screen.getByText('2 UNKNOWN / day')).toBeInTheDocument()
  })

  it('should, when the policy is a spending limit, name the allowance module as its enforcement', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockSpendingLimitPolicy())} onClose={jest.fn()} />)

    expect(within(screen.getByTestId('policy-meta-Enforced by')).getByText('Safe allowance module')).toBeInTheDocument()
  })

  it('should, when the policy is a recovery, name the delay module as its enforcement', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockRecoveryPolicy())} onClose={jest.fn()} />)

    expect(within(screen.getByTestId('policy-meta-Enforced by')).getByText('Safe delay module')).toBeInTheDocument()
  })

  it('should, when the policy is a proposer grant, state that no module enforces it and link nothing', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockProposerPolicy())} onClose={jest.fn()} />)

    const row = screen.getByTestId('policy-meta-Enforced by')

    expect(row).toHaveTextContent('No module')
    expect(within(row).queryByRole('link')).not.toBeInTheDocument()
  })

  it('should, when the module is not enabled on the Safe, still name it and mark the policy unenforced', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockUnenforcedPolicy())} onClose={jest.fn()} />)

    expect(screen.getByTestId('policy-status-unenforced')).toBeInTheDocument()
    expect(within(screen.getByTestId('policy-meta-Enforced by')).getByText('Safe allowance module')).toBeInTheDocument()
  })

  it('should, when the policy is a recovery, render its recoverer, review window and proposal expiry', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockRecoveryPolicy())} onClose={jest.fn()} />)

    const section = screen.getByTestId('policy-recovery')

    expect(within(section).getByTestId('policy-meta-Recoverer')).toBeInTheDocument()
    expect(within(section).getByTestId('policy-meta-Review window')).toHaveTextContent('28 days')
    expect(within(section).getByTestId('policy-meta-Proposal expiry')).toHaveTextContent('Never')
  })

  it('should, when the policy is a proposer grant, render the proposer and the signer who granted it', () => {
    render(<PolicyDetailPanel policy={asActivePolicy(mockProposerPolicy())} onClose={jest.fn()} />)

    const section = screen.getByTestId('policy-proposer')

    expect(within(section).getByTestId('policy-meta-Proposer')).toBeInTheDocument()
    expect(within(section).getByTestId('policy-meta-Granted by')).toBeInTheDocument()
  })

  it('should, when a banner is given, render it above the policy content', () => {
    render(
      <PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} banner={<div>Awaiting signatures</div>} />,
    )

    expect(screen.getByText('Awaiting signatures')).toBeInTheDocument()
  })

  it('should, when a footer is given, render it', () => {
    render(<PolicyDetailPanel policy={mockPendingPolicy()} onClose={jest.fn()} footer={<button>Sign</button>} />)

    expect(screen.getByRole('button', { name: 'Sign' })).toBeInTheDocument()
  })

  it('should, when allowance detail is given, render it under each allowance', () => {
    render(
      <PolicyDetailPanel
        policy={asActivePolicy(mockSpendingLimitPolicy())}
        onClose={jest.fn()}
        renderAllowanceDetail={(allowance) => <span>{`used-${allowance.token.symbol}`}</span>}
      />,
    )

    expect(screen.getByText('used-USDC')).toBeInTheDocument()
    expect(screen.getByText('used-USDT')).toBeInTheDocument()
  })
})
