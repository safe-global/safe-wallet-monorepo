import { type ReactNode } from 'react'
import type * as ReactModule from 'react'
import type * as SafeScopeModule from '@/components/tx-flow/safe-scope'
import { TxModalContext } from '@/components/tx-flow'
import { SMART_CONTRACT_PROPOSER_ERROR } from '@/features/proposers/constants'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import { useGrantProposer, type GrantProposer } from '../hooks/useGrantProposer'
import ProposerRoleFlow from '../index'

jest.mock('../../SafeAccountSelector/hooks/useEligibleSafeAccounts')
jest.mock('../hooks/useProposerValidation', () => ({ useProposerValidation: () => async () => undefined }))
jest.mock('../hooks/useGrantProposer', () => ({ useGrantProposer: jest.fn() }))
jest.mock('@/features/safe-shield', () => ({
  __esModule: true,
  default: () => <div data-testid="safe-shield-widget" />,
}))
jest.mock('@/components/tx-flow/common/TxStatusWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="tx-status-widget" />,
}))
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactNode }) => <>{children(true)}</>,
}))
jest.mock('@/components/common/ChainIndicator', () => {
  const Mock = ({ chainId }: { chainId: string }) => <img data-testid="chain-logo-img" alt={`chain-${chainId}`} />
  Mock.displayName = 'ChainIndicator'
  return { __esModule: true, default: Mock }
})

// The real provider fetches the Safe, builds a provider and an SDK; the flow only needs the scope contract.
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => {
  const React = jest.requireActual<typeof ReactModule>('react')
  const { SafeScopeContext } = jest.requireActual<typeof SafeScopeModule>('@/components/tx-flow/safe-scope')
  const Provider = ({ children }: { children: ReactNode }) => {
    const [target, setTarget] = React.useState<{ chainId: string; safeAddress: string }>()
    const value = React.useMemo(
      () => ({
        scope: target
          ? {
              ...target,
              scopeKey: `${target.chainId}:${target.safeAddress}` as const,
              safeLoaded: false,
              safeLoading: false,
            }
          : undefined,
        setScope: (chainId: string, safeAddress: string) => setTarget({ chainId, safeAddress }),
        clearScope: () => setTarget(undefined),
      }),
      [target],
    )
    return <SafeScopeContext.Provider value={value}>{children}</SafeScopeContext.Provider>
  }
  return { __esModule: true, SafeScopeProvider: Provider, default: Provider }
})

const mockUseEligibleSafeAccounts = jest.mocked(useEligibleSafeAccounts)
const mockUseGrantProposer = jest.mocked(useGrantProposer)

const PROPOSER = '0x8675B754342754A30A2AeF474D114d8460bca19b'

const grantState = (overrides: Partial<GrantProposer> = {}): GrantProposer => ({
  grantProposerRole: jest.fn().mockResolvedValue(false),
  isSubmitting: false,
  error: undefined,
  blockedReason: undefined,
  reset: jest.fn(),
  ...overrides,
})

const renderFlow = () => {
  const setTxFlow = jest.fn()
  const rendered = renderWithUserEvent(
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
      <ProposerRoleFlow />
    </TxModalContext.Provider>,
  )
  return { ...rendered, setTxFlow }
}

const fillAndSubmit = async (user: ReturnType<typeof renderFlow>['user']) => {
  await user.click(screen.getByTestId('safe-account-selector'))
  await user.click(await screen.findByRole('option', { name: /Treasury/ }))
  await user.click(screen.getByRole('combobox', { name: 'Proposer' }))
  await user.paste(PROPOSER)
  await user.click(screen.getByRole('textbox', { name: 'Proposer name' }))
  await user.paste('Nicole')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled())
  await user.click(screen.getByRole('button', { name: 'Submit' }))
}

const SAFE = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
const OTHER_SAFE = '0xBBBBbbbbBBbbbbBBBbBBbbbBbBbbbbbBBBbbBBbB'
const treasury: SafeAccountOption = {
  id: buildSafeAccountId('137', SAFE),
  chainId: '137',
  address: SAFE,
  name: 'Treasury',
  eligibility: 'signer',
  threshold: 3,
  owners: 5,
  chain: { chainId: '137', chainName: 'Polygon', chainLogoUri: null, shortName: 'matic' },
}
const payroll: SafeAccountOption = {
  ...treasury,
  id: buildSafeAccountId('137', OTHER_SAFE),
  address: OTHER_SAFE,
  name: 'Payroll',
}

describe('ProposerRoleFlow', () => {
  beforeEach(() => {
    mockUseEligibleSafeAccounts.mockReturnValue({
      accounts: [treasury],
      isLoading: false,
      isError: false,
      hasWallet: true,
      refetch: jest.fn(),
    })
    mockUseGrantProposer.mockReturnValue(grantState())
  })

  it('renders the page title and the policy header', () => {
    render(<ProposerRoleFlow />)

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create new policy')
    expect(screen.getByRole('heading', { name: /Proposer role/ })).toBeInTheDocument()
    expect(screen.getByText('Let teammates without signing rights propose transactions.')).toBeInTheDocument()
  })

  it('shows neither the status rail nor the Safe Shield panel', () => {
    render(<ProposerRoleFlow />)

    expect(screen.queryByTestId('tx-status-widget')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safe-shield-widget')).not.toBeInTheDocument()
  })

  it('keeps submit disabled until a Safe account and a proposer are set', async () => {
    const { user } = renderWithUserEvent(<ProposerRoleFlow />)
    const submit = screen.getByRole('button', { name: 'Submit' })

    expect(submit).toBeDisabled()

    await user.click(screen.getByTestId('safe-account-selector'))
    await user.click(await screen.findByRole('option', { name: /Treasury/ }))
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('combobox', { name: 'Proposer' }))
    await user.paste(PROPOSER)

    await waitFor(() => expect(submit).toBeEnabled())
  })

  it('passes the account loading and error states through to the selector', async () => {
    const refetch = jest.fn()
    mockUseEligibleSafeAccounts.mockReturnValue({
      accounts: [],
      isLoading: false,
      isError: true,
      hasWallet: true,
      refetch,
    })
    const { user } = renderWithUserEvent(<ProposerRoleFlow />)

    await user.click(screen.getByTestId('safe-account-selector'))
    await user.click(await screen.findByRole('button', { name: /retry/i }))

    expect(refetch).toHaveBeenCalled()
  })

  describe('submitting', () => {
    it('grants the proposer and closes the flow on success', async () => {
      const grantProposerRole = jest.fn().mockResolvedValue(true)
      mockUseGrantProposer.mockReturnValue(grantState({ grantProposerRole }))
      const { user, setTxFlow } = renderFlow()

      await fillAndSubmit(user)

      expect(grantProposerRole).toHaveBeenCalledWith({ proposer: PROPOSER, name: 'Nicole' })
      await waitFor(() => expect(setTxFlow).toHaveBeenCalledWith(undefined))
    })

    it('clears a previous error when another Safe account is picked', async () => {
      const reset = jest.fn()
      mockUseGrantProposer.mockReturnValue(grantState({ error: new Error('boom'), reset }))
      mockUseEligibleSafeAccounts.mockReturnValue({
        accounts: [treasury, payroll],
        isLoading: false,
        isError: false,
        hasWallet: true,
        refetch: jest.fn(),
      })
      const { user } = renderFlow()

      await user.click(screen.getByTestId('safe-account-selector'))
      await user.click(await screen.findByRole('option', { name: /Payroll/ }))

      expect(reset).toHaveBeenCalled()
    })

    it('shows the signing error under the form', () => {
      mockUseGrantProposer.mockReturnValue(grantState({ error: new Error('boom') }))
      renderFlow()

      expect(screen.getByText('Error adding proposer')).toBeInTheDocument()
    })

    it('shows the rejected-signature copy when the wallet rejects', () => {
      const rejection = Object.assign(new Error('rejected'), { code: 'ACTION_REJECTED' })
      mockUseGrantProposer.mockReturnValue(grantState({ error: rejection }))
      renderFlow()

      expect(screen.getByText('The signature request was rejected. Try again to continue.')).toBeInTheDocument()
    })

    it('shows the blocked reason when the proposer is a smart contract', () => {
      mockUseGrantProposer.mockReturnValue(grantState({ blockedReason: SMART_CONTRACT_PROPOSER_ERROR }))
      renderFlow()

      expect(screen.getByText(SMART_CONTRACT_PROPOSER_ERROR)).toBeInTheDocument()
    })

    it('swaps the submit label for a spinner while the grant is in flight', () => {
      mockUseGrantProposer.mockReturnValue(grantState({ isSubmitting: true }))
      renderFlow()

      const submit = screen.getByTestId('submit-proposer-btn')
      expect(submit).toBeDisabled()
      expect(submit).not.toHaveTextContent('Submit')
    })
  })
})
