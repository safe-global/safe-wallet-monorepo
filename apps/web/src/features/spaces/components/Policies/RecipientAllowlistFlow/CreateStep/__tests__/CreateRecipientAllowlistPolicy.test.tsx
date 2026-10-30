import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { render, screen, fireEvent } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { TxModalContext } from '@/components/tx-flow'
import { TxFlowContext, initialContext } from '@/components/tx-flow/TxFlowProvider'
import { useSafeShieldForAddressPoisoning } from '@/features/safe-shield/SafeShieldContext'
import {
  createDefaultAllowlistValues,
  type AllowlistFormRecipient,
  type RecipientAllowlistFormValues,
} from '../../types'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import type { GuardStatus } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../../hooks/useGuardStatus'
import useHeldTokenAddresses from '../../hooks/useHeldTokenAddresses'
import { useSpendingLimitImpacts, type SpendingLimitImpactsResult } from '../../hooks/useSpendingLimitImpacts'
import type { SpendingLimitImpact, SpendingLimitImpactKind } from '../../utils/spendingLimitImpacts'
import CreateRecipientAllowlistPolicy from '..'

const SEPOLIA = '11155111'
const SAFE_A = faker.finance.ethereumAddress()
const SAFE_B = faker.finance.ethereumAddress()
const RECIPIENT = checksumAddress(faker.finance.ethereumAddress())

const mockSetTxFlow = jest.fn()
const mockPush = jest.fn()

jest.mock('../../hooks/useRecipientAllowlistSafeAccounts', () => ({ useRecipientAllowlistSafeAccounts: jest.fn() }))
jest.mock('../../hooks/useGuardStatus', () => ({ useGuardStatus: jest.fn() }))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({ useSafeShieldForAddressPoisoning: jest.fn() }))
jest.mock('@/features/policy-guard/store/guardDelayApi', () => ({
  ...jest.requireActual('@/features/policy-guard/store/guardDelayApi'),
  useGetGuardDelayQuery: () => ({ currentData: undefined }),
}))

jest.mock('../../hooks/useHeldTokenAddresses')
jest.mock('../../hooks/useSpendingLimitImpacts', () => ({ useSpendingLimitImpacts: jest.fn() }))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useMergedAddressBooks: () => ({ has: () => false }),
  useSafeNameResolver: () => () => '',
}))
jest.mock('../AddFromAddressBook', () => ({ __esModule: true, default: () => null }))
jest.mock('../TokenDraftRow', () => ({ __esModule: true, default: () => null }))
jest.mock('../RecipientDraftRow', () => ({
  __esModule: true,
  default: ({ onAdd }: { onAdd: (recipient: AllowlistFormRecipient) => void }) => (
    <button type="button" onClick={() => onAdd({ address: RECIPIENT, name: 'Dave', selected: true })}>
      confirm draft
    </button>
  ),
}))

// The selector has its own suite; here only what the step does with a pick is under test.
jest.mock('../../../SafeAccountSelector', () => ({
  __esModule: true,
  default: ({ value, onChange }: { value?: string; onChange: (id: string) => void }) => (
    <div data-testid="selector" data-value={value ?? ''}>
      <button type="button" onClick={() => onChange(buildSafeAccountId(SEPOLIA, SAFE_B))}>
        pick safe
      </button>
    </div>
  ),
}))

const mockUseAccounts = useRecipientAllowlistSafeAccounts as jest.MockedFunction<
  typeof useRecipientAllowlistSafeAccounts
>
const mockUseGuardStatus = useGuardStatus as jest.MockedFunction<typeof useGuardStatus>
const mockHeld = useHeldTokenAddresses as jest.MockedFunction<typeof useHeldTokenAddresses>
const mockPoisoning = useSafeShieldForAddressPoisoning as jest.MockedFunction<typeof useSafeShieldForAddressPoisoning>
const mockSpendingLimits = useSpendingLimitImpacts as jest.MockedFunction<typeof useSpendingLimitImpacts>

const spendingLimitImpact = (impact: SpendingLimitImpactKind): SpendingLimitImpact => ({
  spender: SAFE_B,
  allowance: {
    token: { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: null },
    amount: '1',
    spent: '0',
    remaining: '1',
    resetPeriodMinutes: 1_440,
    resetsAtMinute: null,
  },
  impact,
  recipients: impact === 'restricted' ? [RECIPIENT] : [],
})

const spendingLimits = (overrides: Partial<SpendingLimitImpactsResult> = {}) =>
  mockSpendingLimits.mockReturnValue({
    impacts: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    ...overrides,
  })

const holdNative = (overrides: Partial<ReturnType<typeof useHeldTokenAddresses>> = {}) =>
  mockHeld.mockReturnValue({
    addresses: [ZERO_ADDRESS],
    options: [{ address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', decimals: 18, group: 'held' }],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: '1:0x1',
    ...overrides,
  })

const completeValues = (): RecipientAllowlistFormValues => ({
  ...createDefaultAllowlistValues(),
  recipients: [{ address: RECIPIENT, name: 'Dave', selected: true }],
})

const option = (address: string, extra: Partial<SafeAccountOption> = {}): SafeAccountOption => ({
  id: buildSafeAccountId(SEPOLIA, address),
  chainId: SEPOLIA,
  address,
  name: 'Treasury',
  eligibility: 'signer',
  chain: { chainId: SEPOLIA, chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
  ...extra,
})

const accounts = (
  options: SafeAccountOption[],
  extra: Partial<ReturnType<typeof useRecipientAllowlistSafeAccounts>> = {},
) =>
  mockUseAccounts.mockReturnValue({
    accounts: groupSafeAccounts(options),
    isLoading: false,
    isError: false,
    hasWallet: true,
    signersOnly: false,
    refetch: jest.fn(),
    hasSelectableAccount: options.some((entry) => !entry.ineligibleReason),
    ...extra,
  })

const guard = (status?: GuardStatus, retry = jest.fn()) => mockUseGuardStatus.mockReturnValue({ guard: status, retry })

const renderStep = (scopeKey?: string, data?: RecipientAllowlistFormValues) => {
  const setScope = jest.fn()
  const onNext = jest.fn()
  const onSpendingLimitImpact = jest.fn()
  const tree = (key?: string) => (
    <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow: mockSetTxFlow, setFullWidth: jest.fn() }}>
      <TxFlowContext.Provider value={{ ...initialContext, data: data && { ...data, rules: [] }, onNext }}>
        <SafeScopeContext.Provider
          value={{
            scope: key
              ? {
                  chainId: SEPOLIA,
                  safeAddress: key.split(':')[1],
                  scopeKey: key as `${string}:${string}`,
                  safeLoaded: true,
                  safeLoading: false,
                }
              : undefined,
            setScope,
            clearScope: jest.fn(),
          }}
        >
          <CreateRecipientAllowlistPolicy
            dismissedCallouts={{ tokens: false, recipients: false }}
            onDismissCallout={jest.fn()}
            onSpendingLimitImpact={onSpendingLimitImpact}
          />
        </SafeScopeContext.Provider>
      </TxFlowContext.Provider>
    </TxModalContext.Provider>
  )
  const { rerender } = render(tree(scopeKey), { routerProps: { push: mockPush } })
  return {
    setScope,
    onNext,
    onSpendingLimitImpact,
    switchTo: (key?: string) => rerender(tree(key)),
    rerender: () => rerender(tree(scopeKey)),
  }
}

describe('CreateRecipientAllowlistPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    guard(undefined)
    holdNative()
    spendingLimits()
  })

  it('scopes the flow to the picked Safe', () => {
    accounts([option(SAFE_A), option(SAFE_B)])
    const { setScope } = renderStep()

    fireEvent.click(screen.getByRole('button', { name: 'pick safe' }))

    expect(setScope).toHaveBeenCalledWith(SEPOLIA, SAFE_B)
  })

  it('checks the guards of the picked Safe', () => {
    accounts([option(SAFE_A)])
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByTestId('selector')).toHaveAttribute('data-value', buildSafeAccountId(SEPOLIA, SAFE_A))
    expect(mockUseGuardStatus).toHaveBeenLastCalledWith({ chainId: SEPOLIA, safeAddress: SAFE_A })
  })

  it('does not check the guards before a Safe is picked', () => {
    accounts([option(SAFE_A)])
    renderStep()

    expect(mockUseGuardStatus).toHaveBeenLastCalledWith(undefined)
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it.each<GuardStatus>([
    { status: 'loading' },
    { status: 'error' },
    { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: SAFE_B }] },
    { status: 'unsupported' },
    { status: 'not-activated' },
  ])('keeps Next disabled and hides the form, with guard state %o', (status) => {
    accounts([option(SAFE_A)])
    guard(status)
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    expect(screen.getByTestId('next-btn')).toBeDisabled()
    expect(screen.queryByTestId('allowlist-recipients-section')).not.toBeInTheDocument()
  })

  it.each<GuardStatus>([
    { status: 'none' },
    { status: 'known' },
    { status: 'partial', missingSlot: 'module' },
    { status: 'partial', missingSlot: 'transaction' },
  ])('enables Next once a token and a recipient are selected, with guard state %o', (status) => {
    accounts([option(SAFE_A)])
    guard(status)
    const { onNext } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByTestId('allowlist-recipients-section')).toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'confirm draft' }))
    expect(screen.getByTestId('next-btn')).toBeEnabled()

    fireEvent.click(screen.getByTestId('next-btn'))
    expect(onNext).toHaveBeenCalledWith({
      ...completeValues(),
      rules: [{ tokenAddress: ZERO_ADDRESS, recipients: [RECIPIENT] }],
    })
  })

  it('should add Existing policies on Next, when the allowlist restricts a spending limit', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    spendingLimits({ impacts: [spendingLimitImpact('restricted')] })
    const { onNext, onSpendingLimitImpact } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    fireEvent.click(screen.getByTestId('next-btn'))

    expect(onSpendingLimitImpact).toHaveBeenCalledWith(true)
    expect(onNext).toHaveBeenCalled()
  })

  it('should add Existing policies on Next, when the allowlist restricts some spending limits and blocks the others', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    spendingLimits({ impacts: [spendingLimitImpact('restricted'), spendingLimitImpact('blocked')] })
    const { onSpendingLimitImpact } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    fireEvent.click(screen.getByTestId('next-btn'))

    expect(onSpendingLimitImpact).toHaveBeenCalledWith(true)
  })

  it('should add Existing policies on Next, when the allowlist blocks every spending limit', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    spendingLimits({ impacts: [spendingLimitImpact('blocked')] })
    const { onSpendingLimitImpact } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    fireEvent.click(screen.getByTestId('next-btn'))

    expect(onSpendingLimitImpact).toHaveBeenCalledWith(true)
  })

  it('should skip Existing policies on Next, when the Safe has no spending limits', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    const { onSpendingLimitImpact } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    fireEvent.click(screen.getByTestId('next-btn'))

    expect(onSpendingLimitImpact).toHaveBeenCalledWith(false)
  })

  it('should add Existing policies on Next, when the spending limits failed to load', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    spendingLimits({ isError: true })
    const { onNext, onSpendingLimitImpact } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    fireEvent.click(screen.getByTestId('next-btn'))

    expect(onSpendingLimitImpact).toHaveBeenCalledWith(true)
    expect(onNext).toHaveBeenCalled()
  })

  it('should keep Next disabled, when the spending limits are still loading', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    spendingLimits({ isLoading: true })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('runs the address-poisoning check on every recipient', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(mockPoisoning).toHaveBeenLastCalledWith([])

    fireEvent.click(screen.getByRole('button', { name: 'confirm draft' }))

    expect(mockPoisoning).toHaveBeenLastCalledWith([RECIPIENT])
  })

  it('keeps Next disabled while the held tokens load', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    holdNative({ isLoading: true })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('keeps Next disabled when the held tokens fail to load', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    holdNative({ isError: true })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('keeps Next disabled when every token is deselected', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), { ...completeValues(), excludedTokens: [ZERO_ADDRESS] })

    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('disables Next again when the guard state turns unknown', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    const { rerender } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())
    expect(screen.getByTestId('next-btn')).toBeEnabled()

    guard({ status: 'unknown', foreignGuards: [{ slot: 'transaction', address: SAFE_B }] })
    rerender()

    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('restores the selections from the flow data when coming back', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    expect(screen.getByRole('button', { name: 'Allow Dave' })).toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeEnabled()
  })

  it('resets the recipients and reopens the draft row when the Safe changes', () => {
    accounts([option(SAFE_A), option(SAFE_B)])
    guard({ status: 'none' })
    const { switchTo } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    fireEvent.click(screen.getByRole('button', { name: 'confirm draft' }))
    expect(screen.getByRole('button', { name: 'Allow Dave' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'confirm draft' })).not.toBeInTheDocument()

    switchTo(buildSafeAccountId(SEPOLIA, SAFE_B))

    expect(screen.queryByRole('button', { name: 'Allow Dave' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'confirm draft' })).toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('names the picked Safe and its chain in the summary', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'none' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByText(/Treasury on Sepolia/)).toBeInTheDocument()
  })

  it.each<GuardStatus>([{ status: 'none' }, { status: 'known' }])(
    'shows no guard banner when an allowlist can be set up, with guard state %o',
    (status) => {
      accounts([option(SAFE_A)])
      guard(status)
      renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

      expect(screen.queryByTestId(/^guard-status-/)).not.toBeInTheDocument()
    },
  )

  it('shows the partial guard warning next to the form', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'partial', missingSlot: 'module' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByTestId('guard-status-warning')).toHaveTextContent('The Safe policy guard is only partly enabled')
    expect(screen.getByTestId('allowlist-recipients-section')).toBeInTheDocument()
  })

  it('shows the guard banner when the guard blocks an allowlist', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'unsupported' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByTestId('guard-status-destructive')).toHaveTextContent('This Safe account needs an update')
  })

  it('shows the summary and both sections before a Safe is picked', () => {
    accounts([option(SAFE_A)])
    renderStep()

    expect(screen.getByText('Pick a Safe account to start.')).toBeInTheDocument()
    expect(screen.getByTestId('allowlist-recipients-section')).toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('closes the flow without a discard prompt and opens the Safe settings for an unknown guard', async () => {
    accounts([option(SAFE_A)])
    guard({ status: 'unknown', foreignGuards: [{ slot: 'transaction', address: SAFE_B }] })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A), completeValues())

    expect(screen.getByTestId('installed-policies')).toHaveTextContent('Unknown policy')
    expect(screen.getByTestId('next-btn')).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Go to Safe settings' }))

    expect(mockSetTxFlow).toHaveBeenCalledWith(undefined)
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining(`/settings/modules?safe=sep:${SAFE_A}`))
  })

  it.each<[GuardStatus, string]>([
    [{ status: 'none' }, 'take effect as soon as this transaction is executed'],
    [{ status: 'known' }, 'policy guard is already enabled'],
    [{ status: 'partial', missingSlot: 'module' }, 'policy guard is already enabled'],
  ])('explains when the changes apply for guard status %o', async (status, copy) => {
    accounts([option(SAFE_A)])
    guard(status)
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    await userEvent.hover(screen.getByRole('button', { name: 'When this takes effect' }))

    expect(await screen.findByText(new RegExp(copy))).toBeInTheDocument()
  })

  it('should say the changes wait the installed guard delay, when the Safe runs a guard with another delay than the configured one', async () => {
    accounts([option(SAFE_A)])
    mockUseGuardStatus.mockReturnValue({
      guard: { status: 'known' },
      guardAddress: '0x46d22E0B3DC367b48bc2d64B789ae154b3177a57',
      retry: jest.fn(),
    })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    await userEvent.hover(screen.getByRole('button', { name: 'When this takes effect' }))

    expect(await screen.findByText(/these changes wait 10 minutes after execution/)).toBeInTheDocument()
  })

  it('retries a failed guard check', () => {
    const retry = jest.fn()
    accounts([option(SAFE_A)])
    guard({ status: 'error' }, retry)
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))

    expect(retry).toHaveBeenCalledTimes(1)
  })

  it('does not check the guards of a Safe that cannot take an allowlist', () => {
    accounts([option(SAFE_A, { ineligibleReason: 'unsupported-safe-version' }), option(SAFE_B)])
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(mockUseGuardStatus).toHaveBeenLastCalledWith(undefined)
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('shows no summary for a selected Safe that cannot take an allowlist', () => {
    accounts([option(SAFE_A, { ineligibleReason: 'unsupported-safe-version' }), option(SAFE_B)])
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.queryByText('Pick a Safe account to start.')).not.toBeInTheDocument()
    expect(screen.queryByText(/Treasury on Sepolia/)).not.toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it('says so when no Safe can take an allowlist', () => {
    accounts([option(SAFE_A, { ineligibleReason: 'no-recipient-allowlists' })])
    renderStep()

    expect(screen.getByTestId('no-eligible-safes')).toHaveTextContent('No eligible Safes')
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it.each([
    ['loading', { isLoading: true }],
    ['failed to load', { isError: true }],
    ['without a wallet', { hasWallet: false }],
  ])('does not claim there are no eligible Safes while %s', (_, extra) => {
    accounts([], extra)
    renderStep()

    expect(screen.queryByTestId('no-eligible-safes')).not.toBeInTheDocument()
  })
})
