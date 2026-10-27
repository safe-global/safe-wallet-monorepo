import { faker } from '@faker-js/faker'
import { useFormContext } from 'react-hook-form'
import { render, screen, fireEvent, waitFor } from '@/tests/test-utils'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import { SafeScopeContext } from '@safe-global/views/components/tx-flow/safe-scope/context'
import type { SafeAccountOption } from '@safe-global/views/features/spaces/components/Policies/SafeAccountSelector/types'
import type { GuardStatus } from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/GuardStatusBanner'
import { buildSafeAccountId, groupSafeAccounts } from '../../../SafeAccountSelector/utils'
import { useRecipientAllowlistSafeAccounts } from '../../hooks/useRecipientAllowlistSafeAccounts'
import { useGuardStatus } from '../../hooks/useGuardStatus'
import CreateRecipientAllowlistPolicy from '..'

const SEPOLIA = '11155111'
const SAFE_A = faker.finance.ethereumAddress()
const SAFE_B = faker.finance.ethereumAddress()
const SPACE_ID = '11111111-1111-1111-1111-111111111111'

jest.mock('../../hooks/useRecipientAllowlistSafeAccounts', () => ({ useRecipientAllowlistSafeAccounts: jest.fn() }))
jest.mock('../../hooks/useGuardStatus', () => ({ useGuardStatus: jest.fn() }))

const mockUseUrlSpaceId = jest.fn<string | null, []>()
jest.mock('@/hooks/useUrlSpaceId', () => ({
  ...jest.requireActual('@/hooks/useUrlSpaceId'),
  useUrlSpaceId: () => mockUseUrlSpaceId(),
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

const TOKEN = faker.finance.ethereumAddress()
const RECIPIENT = faker.finance.ethereumAddress()

// The fields have their own selector and address inputs; here only what the step does with their values is under test.
jest.mock('../AllowlistFields', () => {
  const MockAllowlistFields = () => {
    const { setValue } = useFormContext()
    return (
      <button
        type="button"
        onClick={() => {
          setValue('tokens.0.address', TOKEN)
          setValue('recipients.0.address', RECIPIENT)
        }}
      >
        fill allowlist
      </button>
    )
  }
  return { __esModule: true, default: MockAllowlistFields }
})

const mockUseAccounts = useRecipientAllowlistSafeAccounts as jest.MockedFunction<
  typeof useRecipientAllowlistSafeAccounts
>
const mockUseGuardStatus = useGuardStatus as jest.MockedFunction<typeof useGuardStatus>

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

const renderStep = (scopeKey?: string) => {
  const setScope = jest.fn()
  const onNext = jest.fn()
  render(
    <TxFlowContext.Provider value={{ onNext } as never}>
      <SafeScopeContext.Provider
        value={{
          scope: scopeKey
            ? {
                chainId: SEPOLIA,
                safeAddress: scopeKey.split(':')[1],
                scopeKey: scopeKey as `${string}:${string}`,
                safeLoaded: true,
                safeLoading: false,
              }
            : undefined,
          setScope,
          clearScope: jest.fn(),
        }}
      >
        <CreateRecipientAllowlistPolicy />
      </SafeScopeContext.Provider>
    </TxFlowContext.Provider>,
  )
  return { setScope, onNext }
}

describe('CreateRecipientAllowlistPolicy', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseUrlSpaceId.mockReturnValue(null)
    guard(undefined)
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
    { status: 'partial', missingSlot: 'module' },
    { status: 'unknown', foreignGuards: [{ slot: 'transaction', address: SAFE_B }] },
    { status: 'unsupported' },
    { status: 'not-activated' },
  ])('hides the allowlist and keeps Next disabled with guard state %o', (status) => {
    accounts([option(SAFE_A)])
    guard(status)
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.queryByRole('button', { name: 'fill allowlist' })).not.toBeInTheDocument()
    expect(screen.getByTestId('next-btn')).toBeDisabled()
  })

  it.each<GuardStatus>([{ status: 'none' }, { status: 'known' }])(
    'continues with the tokens and recipients once both are set, with guard state %o',
    async (status) => {
      accounts([option(SAFE_A)])
      guard(status)
      const { onNext } = renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

      expect(screen.getByTestId('next-btn')).toBeDisabled()

      fireEvent.click(screen.getByRole('button', { name: 'fill allowlist' }))
      await waitFor(() => expect(screen.getByTestId('next-btn')).toBeEnabled())

      fireEvent.click(screen.getByTestId('next-btn'))
      await waitFor(() =>
        expect(onNext).toHaveBeenCalledWith(
          { tokens: [{ address: TOKEN }], recipients: [{ address: RECIPIENT }] },
          expect.anything(),
        ),
      )
    },
  )

  it('links to the Safe settings in the current Workspace', () => {
    mockUseUrlSpaceId.mockReturnValue(SPACE_ID)
    accounts([option(SAFE_A)])
    guard({ status: 'partial', missingSlot: 'module' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByRole('link', { name: 'Go to Safe settings' })).toHaveAttribute(
      'href',
      `/settings/modules?safe=sep:${SAFE_A}&spaceId=${SPACE_ID}`,
    )
  })

  it('links to the Safe settings without a Workspace when the URL has none', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'partial', missingSlot: 'module' })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByRole('link', { name: 'Go to Safe settings' })).toHaveAttribute(
      'href',
      `/settings/modules?safe=sep:${SAFE_A}`,
    )
  })

  it('shows an unknown guard as a shortened, copyable address', () => {
    accounts([option(SAFE_A)])
    guard({ status: 'unknown', foreignGuards: [{ slot: 'transaction', address: SAFE_B }] })
    renderStep(buildSafeAccountId(SEPOLIA, SAFE_A))

    expect(screen.getByText(new RegExp(`${SAFE_B.slice(0, 6)}\\.\\.\\.${SAFE_B.slice(-4)}`, 'i'))).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
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
