import { type ReactNode } from 'react'
import type * as ReactModule from 'react'
import type * as SafeScopeModule from '@/components/tx-flow/safe-scope'
import { render, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { useEligibleSafeAccounts } from '../../SafeAccountSelector/hooks/useEligibleSafeAccounts'
import { buildSafeAccountId } from '../../SafeAccountSelector/utils'
import type { SafeAccountOption } from '../../SafeAccountSelector/types'
import ProposerRoleFlow from '../index'

jest.mock('../../SafeAccountSelector/hooks/useEligibleSafeAccounts')
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

const SAFE = '0xAAAAaaaaAAaaaaAAAaAAaaaAaAaaaaaAAAaaAAaA'
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

describe('ProposerRoleFlow', () => {
  beforeEach(() => {
    mockUseEligibleSafeAccounts.mockReturnValue({
      accounts: [treasury],
      isLoading: false,
      isError: false,
      hasWallet: true,
      refetch: jest.fn(),
    })
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

    await user.type(screen.getByRole('combobox', { name: 'Proposer' }), '0x8675B754342754A30A2AeF474D114d8460bca19b')

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
})
