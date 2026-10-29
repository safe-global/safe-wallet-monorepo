import { cloneElement, type ReactElement, type ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { defaultSafeInfo } from '@safe-global/store/slices/SafeInfo/utils'
import { fireEvent, render, screen, waitFor, within } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChainsModule from '@/hooks/useChains'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import { SafeTxContext, type SafeTxContextParams } from '@safe-global/views/components/tx-flow/SafeTxContext'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import type { AllowlistFormRecipient } from '../../types'
import type { PolicyGuardState } from '@/features/policy-guard'
import type { PolicyGuardContract } from '@/features/policy-guard'
import { getPolicyGuardAddress } from '@/features/policy-guard/services'
import useSafeInfo from '@/hooks/useSafeInfo'
import useWallet from '@/hooks/wallets/useWallet'
import { groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../../hooks/useGuardStatus'
import useHeldTokenAddresses from '../../hooks/useHeldTokenAddresses'
import useSpendingLimitTokenOptions from '../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions'
import { useBuildAllowlistTransaction } from '../useBuildAllowlistTransaction'
import { useSaveAllowlistConfiguration } from '../../hooks/useSaveAllowlistConfiguration'
import ReviewRecipientAllowlist from '..'
import RecipientAllowlistFlow from '../..'

const SEPOLIA = '11155111'
const SAFE = checksumAddress(faker.finance.ethereumAddress())
const RECIPIENT = checksumAddress(faker.finance.ethereumAddress())
const OTHER = checksumAddress(faker.finance.ethereumAddress())
const USDC = checksumAddress(faker.finance.ethereumAddress())
const SCOPE_KEY: `${string}:${string}` = `${SEPOLIA}:${SAFE}`
const WALLET = checksumAddress(faker.finance.ethereumAddress())
const TOM = checksumAddress(faker.finance.ethereumAddress())
const mockResolveName = (address: string): string => ({ [RECIPIENT]: 'Alice', [TOM]: 'Tom' })[address] ?? ''
const PRIYA = checksumAddress(faker.finance.ethereumAddress())
const {
  buildAllowlistConfigurations,
  encodeErc20TransferPolicyData,
}: Pick<PolicyGuardContract, 'buildAllowlistConfigurations'> & {
  encodeErc20TransferPolicyData: (recipients: string[]) => string
} = jest.requireActual('@/features/policy-guard/services/allowlistConfigurations')
const { createAllowlistSetupTxs }: Pick<PolicyGuardContract, 'createAllowlistSetupTxs'> = jest.requireActual(
  '@/features/policy-guard/services/createAllowlistSetupTxs',
)
const {
  decodeErc20TransferPolicyData: mockDecodeRecipients,
}: Pick<PolicyGuardContract, 'decodeErc20TransferPolicyData'> = jest.requireActual(
  '@/features/policy-guard/services/allowlistConfigurations',
)
const { describeSetupCall: mockDescribeSetupCall }: Pick<PolicyGuardContract, 'describeSetupCall'> = jest.requireActual(
  '@/features/policy-guard/services/policyGuardEncoders',
)

jest.mock('../useBuildAllowlistTransaction', () => ({ useBuildAllowlistTransaction: jest.fn() }))
let mockDefaultFallback = 'allow'
jest.mock('@/config/constants', () => ({
  ...jest.requireActual('@/config/constants'),
  get POLICY_DEFAULT_FALLBACK() {
    return mockDefaultFallback
  },
}))
jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  ...jest.requireActual('@safe-global/views/components/ui/tooltip'),
  Tooltip: ({ children }: { children: ReactNode }) => <>{children}</>,
  TooltipTrigger: ({ children, render }: { children: ReactNode; render?: ReactElement }) =>
    render ? cloneElement(render, {}, children) : <>{children}</>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))
jest.mock('@/hooks/useSafeInfo', () => ({ __esModule: true, default: jest.fn() }))
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: () => null,
  useWalletContext: () => null,
}))
jest.mock('@/features/__core__', () => {
  const actual = jest.requireActual('@/features/__core__')
  return {
    ...actual,
    useLoadFeature: (handle: { name: string }) =>
      handle.name === 'policy-guard'
        ? {
            $isReady: true,
            describeSetupCall: mockDescribeSetupCall,
            decodeErc20TransferPolicyData: mockDecodeRecipients,
          }
        : actual.useLoadFeature(handle),
  }
})
jest.mock('../../hooks/useSaveAllowlistConfiguration', () => ({ useSaveAllowlistConfiguration: jest.fn() }))
jest.mock('../../hooks/useRecipientAllowlistSafeAccounts', () => ({ useRecipientAllowlistSafeAccounts: jest.fn() }))
jest.mock('../../hooks/useGuardStatus', () => ({ useGuardStatus: jest.fn() }))
jest.mock('../../hooks/useHeldTokenAddresses')
jest.mock('../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions', () => ({
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/features/safe-shield/SafeShieldContext', () => ({
  ...jest.requireActual('@/features/safe-shield/SafeShieldContext'),
  useSafeShieldForAddressPoisoning: jest.fn(),
}))
jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useAddressBookItem: () => undefined,
  useMergedAddressBooks: () => ({
    list: [],
    has: (address: string) => address === RECIPIENT,
    get: (address: string) => ({ [RECIPIENT]: { name: 'Alice', address }, [TOM]: { name: 'Tom', address } })[address],
  }),
  useSafeNameResolver: () => mockResolveName,
}))
jest.mock('@/components/tx-flow/safe-scope/SafeScopeProvider', () => ({
  SafeScopeProvider: ({ children }: { children: ReactNode }) => (
    <SafeScopeContext.Provider value={scopeValue}>{children}</SafeScopeContext.Provider>
  ),
}))
jest.mock('../../CreateStep/AddFromAddressBook', () => ({ __esModule: true, default: () => null }))
jest.mock('../../CreateStep/TokenDraftRow', () => ({ __esModule: true, default: () => null }))
jest.mock('../../CreateStep/RecipientDraftRow', () => ({
  __esModule: true,
  default: ({ onAdd }: { onAdd: (recipient: { address: string; name: string; selected: boolean }) => void }) => (
    <button type="button" onClick={() => onAdd({ address: RECIPIENT, name: 'Alice', selected: true })}>
      confirm draft
    </button>
  ),
}))
jest.mock('@/components/tx-flow/TxFlowStep', () => ({
  TxFlowStep: ({ children }: { children: ReactNode }) => <>{children}</>,
}))
jest.mock('@/components/tx/ReviewTransactionV2', () => ({
  __esModule: true,
  default: ({
    title,
    children,
    onSubmit,
    withDecodedData,
    withMultisend,
  }: {
    title?: string
    children?: ReactNode
    onSubmit: () => void
    withDecodedData?: boolean
    withMultisend?: boolean
  }) => (
    <div
      data-testid="review-transaction"
      data-title={title}
      data-with-decoded-data={String(withDecodedData)}
      data-with-multisend={String(withMultisend)}
    >
      {children}
      <button onClick={() => onSubmit()}>continue</button>
    </div>
  ),
}))
jest.mock('@/components/tx/ReviewTransactionV2/ReviewTransactionSkeleton', () => ({
  __esModule: true,
  default: () => <div data-testid="review-skeleton" />,
}))

const mockBuild = useBuildAllowlistTransaction as jest.MockedFunction<typeof useBuildAllowlistTransaction>
const mockSave = jest.fn()
const mockUseSave = useSaveAllowlistConfiguration as jest.MockedFunction<typeof useSaveAllowlistConfiguration>
const mockUseAccounts = useRecipientAllowlistSafeAccounts as jest.MockedFunction<
  typeof useRecipientAllowlistSafeAccounts
>
const mockUseOptions = useSpendingLimitTokenOptions as jest.MockedFunction<typeof useSpendingLimitTokenOptions>

const option: SafeAccountOption = {
  id: SCOPE_KEY,
  chainId: SEPOLIA,
  address: SAFE,
  name: 'Treasury',
  eligibility: 'signer',
  chain: { chainId: SEPOLIA, chainName: 'Sepolia', chainLogoUri: null, shortName: 'sep' },
}

const scopeValue = {
  scope: {
    chainId: SEPOLIA,
    safeAddress: SAFE,
    scopeKey: SCOPE_KEY,
    safeLoaded: true,
    safeLoading: false,
  },
  setScope: jest.fn(),
  clearScope: jest.fn(),
}

const rules = [
  { tokenAddress: ZERO_ADDRESS, recipients: [RECIPIENT] },
  { tokenAddress: USDC, recipients: [RECIPIENT, OTHER] },
]

const recipients: AllowlistFormRecipient[] = [RECIPIENT, OTHER].map((address) => ({ address, selected: true }))

const safeTxContext = (overrides: Partial<SafeTxContextParams> = {}): SafeTxContextParams =>
  ({ setSafeTx: jest.fn(), setSafeTxError: jest.fn(), ...overrides }) as unknown as SafeTxContextParams

const onSubmit = jest.fn()

const setIsSubmitLoading = jest.fn()
const setIsSubmitDisabled = jest.fn()

const renderReview = (safeTxOverrides: Partial<SafeTxContextParams> = {}, flowRecipients = recipients) =>
  render(
    <SafeScopeContext.Provider value={scopeValue}>
      <TxFlowContext.Provider
        value={
          {
            ...initialContext,
            data: { rules, recipients: flowRecipients },
            setIsSubmitLoading,
            setIsSubmitDisabled,
          } as unknown as TxFlowContextType
        }
      >
        <SafeTxContext.Provider value={safeTxContext(safeTxOverrides)}>
          <ReviewRecipientAllowlist onSubmit={onSubmit}>
            <div data-testid="flow-children" />
          </ReviewRecipientAllowlist>
        </SafeTxContext.Provider>
      </TxFlowContext.Provider>
    </SafeScopeContext.Provider>,
  )

const configurations = buildAllowlistConfigurations(SEPOLIA, rules)
const guardAddress = getPolicyGuardAddress(SEPOLIA)!

const setupFor = (guardState: PolicyGuardState, input = configurations) =>
  createAllowlistSetupTxs({ chainId: SEPOLIA, safeAddress: SAFE, guardAddress, guardState, configurations: input })

const built = (guardState?: PolicyGuardState) => {
  if (!guardState) return mockBuild.mockReturnValue({})
  const setup = setupFor(guardState)
  return mockBuild.mockReturnValue({
    guardState,
    configurations: setup.configurations,
    root: setup.root,
    txs: setup.txs,
  })
}

const mockOwners = (owners: string[], threshold = 2) =>
  (useSafeInfo as jest.Mock).mockReturnValue({
    safe: {
      ...defaultSafeInfo,
      address: { value: SAFE },
      chainId: SEPOLIA,
      owners: owners.map((value) => ({ value })),
      threshold,
    },
    safeAddress: SAFE,
    safeLoaded: true,
    safeLoading: false,
  })

const actionLabels = () => screen.getAllByTestId('action-item').map((item) => item.textContent)

beforeEach(() => {
  mockDefaultFallback = 'allow'
  jest.clearAllMocks()
  mockSave.mockResolvedValue(true)
  mockOwners([WALLET, TOM, PRIYA])
  ;(useWallet as jest.Mock).mockReturnValue({ address: WALLET })
  mockUseSave.mockReturnValue({ save: mockSave, isSaving: false })
  jest.spyOn(useChainsModule, 'useChain').mockReturnValue(chainBuilder().with({ chainId: SEPOLIA }).build())
  mockUseAccounts.mockReturnValue({
    accounts: groupSafeAccounts([option]),
    isLoading: false,
    isError: false,
    hasWallet: true,
    signersOnly: false,
    refetch: jest.fn(),
    hasSelectableAccount: true,
  })
  mockUseOptions.mockReturnValue({
    options: [
      { address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', decimals: 18, group: 'held' },
      { address: USDC, symbol: 'USDC', name: 'USD Coin', decimals: 6, group: 'held' },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
    isPopularLoading: false,
    isPopularError: false,
    refetchPopular: jest.fn(),
    identityKey: SCOPE_KEY,
  })
})

describe('ReviewRecipientAllowlist', () => {
  it('shows the skeleton until the guard state is known', () => {
    built()
    renderReview()

    expect(screen.getByTestId('review-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('review-transaction')).not.toBeInTheDocument()
  })

  it('still renders the review so the build error shows', () => {
    built()
    renderReview({ safeTxError: new Error('boom') })

    expect(screen.getByTestId('review-transaction')).toBeInTheDocument()
    expect(screen.queryByTestId('review-skeleton')).not.toBeInTheDocument()
    expect(screen.queryByTestId('allowlist-review-summary')).not.toBeInTheDocument()
  })

  it('hides the generic decoded data and action list, since it lists the setup calls itself', () => {
    built({ status: 'partial', missingSlot: 'module' })
    renderReview()

    const review = screen.getByTestId('review-transaction')
    expect(review).toHaveAttribute('data-with-decoded-data', 'false')
    expect(review).toHaveAttribute('data-with-multisend', 'false')
  })

  it('shows the banner with the review description', () => {
    built({ status: 'none' })
    renderReview()

    expect(screen.getByTestId('review-transaction')).toHaveAttribute('data-title', 'Confirm policy')
    expect(
      screen.getByText('Treasury on Sepolia will only be able to send ETH and USDC to 2 recipients.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Check the details below before you sign.')).toBeInTheDocument()
    expect(screen.queryByText('Anything you leave out will be blocked.')).not.toBeInTheDocument()
  })

  it('shows the account, the tokens and the recipients', () => {
    built({ status: 'none' })
    renderReview()

    const summary = within(screen.getByTestId('allowlist-review-summary'))
    expect(summary.getByText('Applies to')).toBeInTheDocument()
    expect(summary.getByText('Treasury')).toBeInTheDocument()
    expect(summary.getByText('Allowed tokens')).toBeInTheDocument()
    expect(summary.getByText('ETH')).toBeInTheDocument()
    expect(summary.getByText('USDC')).toBeInTheDocument()
    expect(summary.getByText('Allowed recipients (2)')).toBeInTheDocument()
    expect(summary.getByText('Alice')).toBeInTheDocument()
    expect(summary.getByLabelText('In your address book')).toBeInTheDocument()
    expect(summary.getByText(shortenAddress(OTHER))).toBeInTheDocument()
    expect(screen.getByTestId('flow-children')).toBeInTheDocument()
  })

  it('names the other owners who sign next', () => {
    built({ status: 'none' })
    renderReview()

    expect(screen.getByTestId('allowlist-next-signers')).toHaveTextContent(
      `Tom and ${shortenAddress(PRIYA)} will be asked to sign next. Nothing changes until it's executed.`,
    )
  })

  it('hides the signer line on a threshold-1 Safe', () => {
    built({ status: 'none' })
    mockOwners([WALLET, TOM, PRIYA], 1)
    renderReview()

    expect(screen.queryByTestId('allowlist-next-signers')).not.toBeInTheDocument()
  })

  it('hides the signer line when there are no other owners', () => {
    built({ status: 'none' })
    mockOwners([WALLET])
    renderReview()

    expect(screen.queryByTestId('allowlist-next-signers')).not.toBeInTheDocument()
  })

  it('shows a recipient name typed in step 1 in the summary and the rule rows', () => {
    built({ status: 'none' })
    renderReview({}, [
      { address: RECIPIENT, selected: true },
      { address: OTHER, name: 'Payroll', selected: true },
    ])

    expect(within(screen.getByTestId('allowlist-review-summary')).getByText('Payroll')).toBeInTheDocument()

    fireEvent.click(screen.getAllByTestId('action-item')[0])

    const [, tokenRule] = screen.getAllByTestId('allowlist-rule')
    expect(within(tokenRule).getByText('Payroll')).toBeInTheDocument()
  })

  it.each([
    [{ status: 'none' }, ['SafePolicyGuard: configureImmediately', 'setGuard', 'setModuleGuard']],
    [{ status: 'known' }, ['SafePolicyGuard: requestConfiguration']],
    [{ status: 'partial', missingSlot: 'transaction' }, ['SafePolicyGuard: requestConfiguration', 'setGuard']],
    [{ status: 'partial', missingSlot: 'module' }, ['SafePolicyGuard: requestConfiguration', 'setModuleGuard']],
  ] as const)('lists the actions the transaction contains for %j', (guardState, labels) => {
    built(guardState)
    renderReview()

    expect(actionLabels()).toEqual(labels.map((label, index) => `${index + 1}${label}`))
  })

  it('says the changes wait 24 hours when the guard is already enabled', () => {
    built({ status: 'known' })
    renderReview()

    expect(screen.getByText(/wait 24 hours after execution/)).toBeInTheDocument()
  })

  it('says the changes apply on execution when no guard is set yet', () => {
    built({ status: 'none' })
    renderReview()

    expect(screen.getByText(/take effect as soon as this transaction is executed/)).toBeInTheDocument()
  })

  it('lists every rule with its policy when the configuring action is expanded', () => {
    built({ status: 'none' })
    renderReview()

    fireEvent.click(screen.getAllByTestId('action-item')[0])

    const rules = screen.getAllByTestId('allowlist-rule')
    const count = setupFor({ status: 'none' }).configurations.length
    expect(rules.map((rule) => within(rule).getByText(/^Rule \d+ of \d+$/).textContent)).toEqual(
      Array.from({ length: count }, (_, index) => `Rule ${index + 1} of ${count}`),
    )
    const [native, token, ...defaults] = rules
    expect(within(native).getByText('Native transfers')).toBeInTheDocument()
    expect(within(native).queryByText('Allowed recipients')).not.toBeInTheDocument()
    expect(within(token).getByText('Token withdraw allowlist')).toBeInTheDocument()
    expect(within(token).getByText('Allowed recipients')).toBeInTheDocument()
    const fallbacks = defaults.slice(-2)
    defaults.slice(0, -2).forEach((rule) => expect(within(rule).getByText('Batched transactions')).toBeInTheDocument())
    fallbacks.forEach((rule) => {
      expect(within(rule).getByText('Allow everything else')).toBeInTheDocument()
      expect(within(rule).getByText('Any address')).toBeInTheDocument()
      expect(within(rule).queryByText('ETH')).not.toBeInTheDocument()
    })
    expect(fallbacks[0]).not.toHaveTextContent('Delegate call')
    expect(fallbacks[1]).toHaveTextContent('Delegate call')
  })

  it('names only the catch-all access "Any address", whatever policy a rule binds', () => {
    const installed = setupFor({ status: 'none' }).configurations
    const fallback = installed[installed.length - 1]
    const [, erc20] = configurations
    const allowOnToken = { ...erc20, policy: fallback.policy, data: '0x' }
    mockBuild.mockReturnValue({
      guardState: { status: 'none' },
      configurations: [allowOnToken, fallback],
      txs: setupFor({ status: 'none' }, [allowOnToken, fallback]).txs,
    })
    renderReview()

    fireEvent.click(screen.getAllByTestId('action-item')[0])

    const [tokenRule, fallbackRule] = screen.getAllByTestId('allowlist-rule')
    expect(within(tokenRule).queryByText('Any address')).not.toBeInTheDocument()
    expect(within(tokenRule).getByText('USDC')).toBeInTheDocument()
    expect(within(fallbackRule).getByText('Any address')).toBeInTheDocument()
  })

  it('says everything else stays allowed on a first setup and lists the gaps', () => {
    built({ status: 'none' })
    renderReview()

    const summary = within(screen.getByTestId('allowlist-review-summary'))
    expect(summary.getByText('Everything else')).toBeInTheDocument()
    expect(screen.getByTestId('allowlist-fallback')).toHaveTextContent(
      'Stays allowed. Only transfers of the selected tokens to recipients not on the list are blocked.',
    )
    const gaps = within(screen.getByTestId('allowlist-gaps'))
    expect(gaps.getByText("What this allowlist doesn't cover")).toBeInTheDocument()
    expect(gaps.getByText(/Token approvals are not restricted/)).toBeInTheDocument()
    expect(gaps.getByText(/Native token transfers to recipients not on the list stay allowed/)).toBeInTheDocument()
    expect(gaps.getByText(/Delegate calls are not restricted/)).toBeInTheDocument()
  })

  it('says everything else is blocked when the first setup installs the deny fallback', () => {
    mockDefaultFallback = 'deny'
    built({ status: 'none' })
    renderReview()

    expect(screen.getByTestId('allowlist-fallback')).toHaveTextContent(
      'Blocked. Only the transfers on this allowlist can be made.',
    )
    expect(screen.queryByTestId('allowlist-gaps')).not.toBeInTheDocument()
  })

  it('shows no fallback row or gaps when the guard is already set, since nothing new is installed', () => {
    built({ status: 'known' })
    renderReview()

    expect(screen.queryByText('Everything else')).not.toBeInTheDocument()
    expect(screen.queryByTestId('allowlist-gaps')).not.toBeInTheDocument()
  })

  it('lists the recipients encoded in the configuration, not the form rules', () => {
    const [native, erc20] = configurations
    const encodedOnlyOther = { ...erc20, data: encodeErc20TransferPolicyData([OTHER]) }
    mockBuild.mockReturnValue({
      guardState: { status: 'none' },
      configurations: [native, encodedOnlyOther],
      txs: setupFor({ status: 'none' }, [native, encodedOnlyOther]).txs,
    })
    renderReview()

    fireEvent.click(screen.getAllByTestId('action-item')[0])

    const erc20Rule = screen.getAllByTestId('allowlist-rule')[1]
    expect(erc20Rule).toHaveTextContent(OTHER)
    expect(erc20Rule).not.toHaveTextContent(RECIPIENT)
  })

  it('never shows the configuration root or the raw calldata', () => {
    built({ status: 'known' })
    renderReview()

    fireEvent.click(screen.getAllByTestId('action-item')[0])

    const {
      root,
      txs: [request],
    } = setupFor({ status: 'known' })
    expect(screen.getAllByTestId('allowlist-rule')).toHaveLength(configurations.length)
    expect(document.body.textContent).not.toContain(root)
    expect(document.body.textContent).not.toContain(request.data)
  })

  it('shows the guard a setter action sets', () => {
    built({ status: 'partial', missingSlot: 'module' })
    renderReview()

    fireEvent.click(screen.getAllByTestId('action-item')[1])

    expect(screen.getByText('moduleGuard')).toBeInTheDocument()
  })

  it.each([['none'], ['known']] as const)('review submit saves before continuing to sign (%s)', async (status) => {
    built({ status })
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: 'continue' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    const { configurations: installed, root } = setupFor({ status })
    expect(mockSave).toHaveBeenCalledWith({ configurations: installed, root })
    expect(mockSave.mock.invocationCallOrder[0]).toBeLessThan(onSubmit.mock.invocationCallOrder[0])
  })

  it('stays on the review and does not sign when the save fails', async () => {
    built({ status: 'none' })
    mockSave.mockResolvedValue(false)
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: 'continue' }))

    await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1))
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('marks the submit as loading only while the save runs', () => {
    built({ status: 'none' })
    mockUseSave.mockReturnValue({ save: mockSave, isSaving: true })
    renderReview()
    expect(setIsSubmitLoading).toHaveBeenLastCalledWith(true)

    mockUseSave.mockReturnValue({ save: mockSave, isSaving: false })
    renderReview()
    expect(setIsSubmitLoading).toHaveBeenLastCalledWith(false)
  })

  it('saves once when Continue is clicked again while the save runs', async () => {
    built({ status: 'none' })
    let finishSave: (saved: boolean) => void = () => {}
    mockSave.mockReturnValue(new Promise<boolean>((resolve) => (finishSave = resolve)))
    renderReview()

    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    fireEvent.click(screen.getByRole('button', { name: 'continue' }))
    finishSave(true)

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(mockSave).toHaveBeenCalledTimes(1)
  })

  it('disables the submit while the save runs', () => {
    built({ status: 'none' })
    mockUseSave.mockReturnValue({ save: mockSave, isSaving: true })
    renderReview()

    expect(setIsSubmitDisabled).toHaveBeenLastCalledWith(true)
  })

  it('disables the submit without configurations and enables it with them', () => {
    built()
    renderReview()
    expect(setIsSubmitDisabled).toHaveBeenLastCalledWith(true)

    built({ status: 'none' })
    renderReview()
    expect(setIsSubmitDisabled).toHaveBeenLastCalledWith(false)
  })

  it('resets the submit loading and disabled state on unmount', () => {
    built({ status: 'none' })
    mockUseSave.mockReturnValue({ save: mockSave, isSaving: true })
    const { unmount } = renderReview()
    setIsSubmitLoading.mockClear()
    setIsSubmitDisabled.mockClear()

    unmount()

    expect(setIsSubmitLoading).toHaveBeenCalledWith(false)
    expect(setIsSubmitDisabled).toHaveBeenCalledWith(false)
  })
})

describe('RecipientAllowlistFlow review round trip', () => {
  it('Back returns to the form with entries kept', async () => {
    built({ status: 'none' })
    ;(useGuardStatus as jest.Mock).mockReturnValue({ guard: { status: 'none' }, retry: jest.fn() })
    ;(useHeldTokenAddresses as jest.Mock).mockReturnValue({
      ...mockUseOptions(),
      addresses: [ZERO_ADDRESS],
    })

    render(<RecipientAllowlistFlow />)

    fireEvent.click(screen.getByRole('button', { name: 'confirm draft' }))
    fireEvent.click(screen.getByTestId('next-btn'))

    expect(await screen.findByTestId('allowlist-review-summary')).toHaveTextContent('Alice')

    fireEvent.click(screen.getByRole('button', { name: /back/i }))

    expect(await screen.findByTestId('allowlist-recipients-section')).toHaveTextContent('Alice')
  })
})
