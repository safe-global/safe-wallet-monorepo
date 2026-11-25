import { Children, useState, type ReactNode } from 'react'
import { render, screen, fireEvent } from '@/tests/test-utils'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { TxFlowType } from '@/services/analytics/types'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import { MOCK_ADDRESSES, MOCK_TOKENS } from '../../../../../public/utils/policies'
import { mockActiveAllowlist } from '../../../../../public/utils/allowlistPolicies'
import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../../hooks/useGuardStatus'
import useHeldTokenAddresses from '../../hooks/useHeldTokenAddresses'
import { useSpendingLimitImpacts } from '../../hooks/useSpendingLimitImpacts'
import type { SpendingLimitImpact } from '../../utils/spendingLimitImpacts'
import type { RecipientAllowlistFlowData } from '../../types'
import EditRecipientAllowlistFlow from '..'

const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'

const mockScope: { safeLoaded: boolean; safeError?: string } = { safeLoaded: true }
const mockRefetchSafe = jest.fn()
const mockFlowProps = jest.fn()

jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({
    initial,
    children,
  }: {
    initial: { chainId: string; safeAddress: string }
    children: ReactNode
  }) => (
    <SafeScopeContext.Provider
      value={{
        scope: {
          ...initial,
          scopeKey: `${initial.chainId}:${initial.safeAddress}`,
          safeLoaded: mockScope.safeLoaded,
          safeLoading: !mockScope.safeLoaded,
          safeError: mockScope.safeError,
        },
        setScope: jest.fn(),
        clearScope: jest.fn(),
      }}
    >
      {children}
    </SafeScopeContext.Provider>
  ),
}))

// A stepper with TxFlow's contract: steps in order, data replaced by `onNext`, then the review.
jest.mock('@/components/tx-flow/TxFlow', () => ({
  TxFlow: (props: { initialData: RecipientAllowlistFlowData; children: ReactNode; eventCategory: string }) => {
    mockFlowProps(props)
    const [step, setStep] = useState(0)
    const [data, setData] = useState(props.initialData)
    const [title, setTitle] = useState<ReactNode>()
    const steps = Children.toArray(props.children)
    return (
      <TxFlowContext.Provider
        value={{
          ...initialContext,
          step,
          data,
          onNext: (next?: RecipientAllowlistFlowData) => {
            if (next) setData(next)
            setStep((current) => current + 1)
          },
          updateTxLayoutProps: (layout) => setTitle(layout.title),
        }}
      >
        <div data-testid="modal-title">{title}</div>
        {step < steps.length ? steps[step] : <pre data-testid="review-data">{JSON.stringify(data)}</pre>}
      </TxFlowContext.Provider>
    )
  },
}))

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/safes', () => ({
  ...jest.requireActual('@safe-global/store/gateway/AUTO_GENERATED/safes'),
  useSafesGetSafeV1Query: () => ({ refetch: mockRefetchSafe }),
}))
jest.mock('../../hooks/useRecipientAllowlistSafeAccounts', () => ({ useRecipientAllowlistSafeAccounts: jest.fn() }))
jest.mock('../../hooks/useGuardStatus', () => ({ useGuardStatus: jest.fn() }))
jest.mock('../../hooks/useHeldTokenAddresses')
jest.mock('../../hooks/useSpendingLimitImpacts', () => ({ useSpendingLimitImpacts: jest.fn() }))
jest.mock('@/features/safe-shield/public/hooks/useSafeShield', () => ({ useSafeShieldForAddressPoisoning: jest.fn() }))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useAddressBookItem: () => undefined,
  useMergedAddressBooks: () => ({ has: () => false, get: () => undefined, list: [] }),
  useSafeNameResolver: () => () => '',
}))
jest.mock('../../ExistingPoliciesStep', () => ({
  __esModule: true,
  default: () => <div data-testid="existing-policies-step" />,
}))

const mockHeld = useHeldTokenAddresses as jest.MockedFunction<typeof useHeldTokenAddresses>
const mockSpendingLimits = useSpendingLimitImpacts as jest.MockedFunction<typeof useSpendingLimitImpacts>

const policy = mockActiveAllowlist()
const { chainId, address: safeAddress } = policy.safe

const holdTokens = (overrides: Partial<ReturnType<typeof useHeldTokenAddresses>> = {}) =>
  mockHeld.mockReturnValue({
    addresses: [MOCK_TOKENS.usdc.address, DAI],
    options: [
      { ...MOCK_TOKENS.usdc, name: 'USD Coin', group: 'held' },
      { address: DAI, symbol: 'DAI', name: 'Dai', decimals: 18, group: 'held' },
      { ...MOCK_TOKENS.usdt, name: 'Tether', group: 'popular' },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: `${chainId}:${safeAddress}`,
    ...overrides,
  })

const treasury: SafeAccountOption = {
  id: buildSafeAccountId(chainId, safeAddress),
  chainId,
  address: safeAddress,
  name: 'Treasury',
  eligibility: 'signer',
  chain: { chainId, chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' },
}

const chip = (name: string) => screen.getByRole('button', { name: `Allow ${name}` })
const recipientChips = () => screen.getAllByRole('button', { name: /^Allow 0x/ })
const next = () => screen.getByTestId('next-btn')

const pick = (search: string, value: string, option: RegExp) => {
  fireEvent.change(screen.getByRole('combobox', { name: search }), { target: { value } })
  fireEvent.click(screen.getByRole('option', { name: option }))
}
const pickToken = (symbol: string) => pick('Search tokens by name or address', symbol, new RegExp(symbol))
const pasteRecipient = (address: string) => pick('Search contacts or paste an address', address, /New recipient/)

const renderFlow = () => render(<EditRecipientAllowlistFlow policy={policy} />)

describe('EditRecipientAllowlistFlow', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockScope.safeLoaded = true
    mockScope.safeError = undefined
    holdTokens()
    mockSpendingLimits.mockReturnValue({ impacts: [], isLoading: false, isError: false, refetch: jest.fn() })
    jest.mocked(useGuardStatus).mockReturnValue({
      guard: {
        status: 'known',
        guardAddress: policy.enforcement.via === 'guard' ? policy.enforcement.guardAddress : '',
      },
      retry: jest.fn(),
    } as ReturnType<typeof useGuardStatus>)
    jest.mocked(useRecipientAllowlistSafeAccounts).mockReturnValue({
      accounts: groupSafeAccounts([treasury]),
      isLoading: false,
      isError: false,
      hasWallet: true,
      signersOnly: false,
      refetch: jest.fn(),
      hasSelectableAccount: true,
    })
  })

  it('should wait for the Safe and its tokens before opening the form', () => {
    mockScope.safeLoaded = false
    const { rerender } = renderFlow()

    expect(screen.getByTestId('allowlist-edit-loading')).toBeInTheDocument()
    expect(mockFlowProps).not.toHaveBeenCalled()

    mockScope.safeLoaded = true
    holdTokens({ isLoading: true })
    rerender(<EditRecipientAllowlistFlow policy={policy} />)

    expect(screen.getByTestId('allowlist-edit-loading')).toBeInTheDocument()
    expect(mockFlowProps).not.toHaveBeenCalled()
  })

  it("should show the tokens load error, when the Safe's tokens cannot be read", () => {
    holdTokens({ isError: true, addresses: [] })
    renderFlow()

    expect(screen.getByText('Could not load the tokens in this account.')).toBeInTheDocument()
    expect(mockFlowProps).not.toHaveBeenCalled()
  })

  it('should keep the form open, when a later token refetch fails', () => {
    const { rerender } = renderFlow()

    holdTokens({ isError: true })
    rerender(<EditRecipientAllowlistFlow policy={policy} />)

    expect(screen.getByTestId('recipient-allowlist-create-step')).toBeInTheDocument()
  })

  it('should open titled Edit policy, with the live tokens and recipients as chips on its fixed Safe', () => {
    renderFlow()

    expect(screen.getByTestId('modal-title')).toHaveTextContent('Edit policy')
    expect(mockFlowProps.mock.calls[0][0].eventCategory).toBe(TxFlowType.EDIT_SPACE_RECIPIENT_ALLOWLIST)
    expect(chip('USDC')).toHaveAttribute('aria-pressed', 'true')
    expect(chip('USDT')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('button', { name: 'Allow DAI' })).not.toBeInTheDocument()
    expect(recipientChips()).toHaveLength(3)
    recipientChips().forEach((recipient) => expect(recipient).toHaveAttribute('aria-pressed', 'true'))
    expect(screen.getByTestId('safe-account-readonly')).toBeInTheDocument()
    expect(screen.queryByTestId('safe-account-selector')).not.toBeInTheDocument()
  })

  it('should show the edit copy in the summary and the section descriptions', () => {
    renderFlow()

    expect(screen.getByRole('status')).toHaveTextContent("You're editing the allowlist on Treasury on Ethereum.")
    expect(screen.getByRole('status')).toHaveTextContent(
      'Anything you deselect will be blocked once the change applies.',
    )
    expect(screen.getByText('Only transfers of the tokens selected below will be allowed.')).toBeInTheDocument()
    expect(screen.getByText('Only transfers to the recipients selected below will be allowed.')).toBeInTheDocument()
  })

  it('should say the Safe could not be loaded and retry loading it, when the Safe read fails', () => {
    mockScope.safeLoaded = false
    mockScope.safeError = 'Failed to load safe info'
    renderFlow()

    expect(screen.getByText('Could not load this Safe account.')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(mockRefetchSafe).toHaveBeenCalledTimes(1)
    expect(mockFlowProps).not.toHaveBeenCalled()
  })

  it('should enable Next only while the allowlist differs from the live one', () => {
    renderFlow()
    expect(next()).toBeDisabled()

    fireEvent.click(recipientChips()[1])
    expect(next()).toBeEnabled()

    pasteRecipient(MOCK_ADDRESSES.bob)
    expect(next()).toBeDisabled()

    pickToken('DAI')
    expect(next()).toBeEnabled()
  })

  it('should keep Next disabled, when every recipient is removed', () => {
    renderFlow()

    recipientChips().forEach((recipient) => fireEvent.click(recipient))

    expect(screen.queryByRole('button', { name: /^Allow 0x/ })).not.toBeInTheDocument()
    expect(next()).toBeDisabled()
  })

  it('should carry the live allowlist to the review with the changed rules', () => {
    renderFlow()

    fireEvent.click(recipientChips()[2])
    fireEvent.click(next())

    const data = JSON.parse(screen.getByTestId('review-data').textContent ?? '') as RecipientAllowlistFlowData
    expect(data.baseline).toEqual(JSON.parse(JSON.stringify(policy.data.entries)))
    expect(data.baselineGuard).toBe(policy.enforcement.via === 'guard' ? policy.enforcement.guardAddress : undefined)
    expect(data.baselineGuard).toBeDefined()
    expect(data.rules).toHaveLength(2)
    expect(data.rules.every(({ recipients }) => recipients.length === 2)).toBe(true)
    expect(
      data.rules.flatMap(({ recipients }) => recipients.map((recipient) => recipient.toLowerCase())),
    ).not.toContain(MOCK_ADDRESSES.unresolved.toLowerCase())
  })

  it('should go through Existing policies, when the change affects a spending limit', () => {
    mockSpendingLimits.mockReturnValue({
      impacts: [{ impact: 'blocked' } as SpendingLimitImpact],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
    renderFlow()

    pickToken('DAI')
    fireEvent.click(next())

    expect(screen.getByTestId('existing-policies-step')).toBeInTheDocument()
  })
})
