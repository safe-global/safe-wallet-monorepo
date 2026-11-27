import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { render } from '@/tests/test-utils'
import CheckWallet, { type CheckWalletProps } from '.'
import { chainBuilder } from '@/tests/builders/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')

jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => chainBuilder().build()),
}))

const NOT_CONNECTED = 'Please connect your wallet'
const NOT_OWNER = 'Your connected wallet is not a signer of this Safe account'
const NOT_ACTIVATED = 'You need to activate the Safe before transacting'
const SDK_LOADING = 'Still loading. Try again in a moment.'

type GateProps = Omit<CheckWalletProps, 'children'>

const renderButton = (props: GateProps = {}) =>
  render(<CheckWallet {...props}>{(ok) => <button disabled={!ok}>Continue</button>}</CheckWallet>)

describe('CheckWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRole('owner')
    mockSafeInfo({ deployed: true })
  })

  it('renders correctly when the wallet is connected to the right chain and is an owner', () => {
    const { getByText } = renderButton()

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button when the wallet is not connected', () => {
    mockRole('disconnected')

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText(NOT_CONNECTED)).toBeInTheDocument()
  })

  it('should disable the button when the wallet is connected to the right chain but is not an owner', () => {
    mockRole('nonOwner')

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText(NOT_OWNER)).toBeInTheDocument()
  })

  it('should be disabled when connected to the wrong network', () => {
    mockRole('wrongChain')

    const { getByText } = renderButton({ checkNetwork: true })

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should not disable the button for non-owner spending limit benificiaries', () => {
    mockRole('spendingLimitBeneficiary')

    const { getByText } = renderButton({ allowSpendingLimit: true })

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should not disable the button for proposers', () => {
    mockRole('proposer')

    const { getByText } = renderButton()

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button for proposers if specified via flag', () => {
    mockRole('proposer')

    const { getByText } = renderButton({ allowProposer: false })

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should not disable the button for proposers that are also owners', () => {
    mockRole('proposerAndOwner')

    const { getByText } = renderButton({ allowProposer: false })

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button for counterfactual Safes', () => {
    mockSafeInfo({ deployed: false })

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText(NOT_ACTIVATED)).toBeInTheDocument()
  })

  it('should enable the button for counterfactual Safes if allowed', () => {
    mockSafeInfo({ deployed: false })

    const { getByText } = renderButton({ allowUndeployedSafe: true })

    expect(getByText('Continue')).toBeEnabled()
  })

  it('should allow non-owners if specified', () => {
    mockRole('nonOwner')

    const { getByText } = renderButton({ allowNonOwner: true })

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should not allow non-owners that have a spending limit without allowing spending limits', () => {
    mockRole('spendingLimitBeneficiary')

    const { getByText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should disable the button if SDK is not initialized and safe is loaded', () => {
    jest.mocked(useSafeSDK).mockReturnValue(undefined)

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText(SDK_LOADING)).toBeInTheDocument()
  })

  it('should not disable the button if SDK is not initialized and safe is not loaded', () => {
    jest.mocked(useSafeSDK).mockReturnValue(undefined)
    const safe = mockSafeInfo({ deployed: true })
    jest.mocked(useSafeInfo).mockReturnValue({
      safe,
      safeAddress: safe.address.value,
      safeLoaded: false,
      safeLoading: true,
    })

    const { getByText } = renderButton()

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should allow nested Safe owners', () => {
    mockRole('nestedOwner')

    const { getByText } = renderButton()

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it.each(['owner', 'proposer'] as const)(
    'should enable the button for %s when spending limits are allowed',
    (role) => {
      mockRole(role)

      const { getByText } = renderButton({ allowSpendingLimit: true })

      expect(getByText('Continue')).not.toBeDisabled()
    },
  )

  it.each(['nonOwner', 'disconnected'] as const)(
    'should disable the button for %s when spending limits are allowed',
    (role) => {
      mockRole(role)

      const { getByText } = renderButton({ allowSpendingLimit: true })

      expect(getByText('Continue')).toBeDisabled()
    },
  )

  it('should disable the button for a disconnected wallet even when non-owners are allowed', () => {
    mockRole('disconnected')

    const { getByText, getByLabelText } = renderButton({ allowNonOwner: true })

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText(NOT_CONNECTED)).toBeInTheDocument()
  })

  it('should enable a nested owner who is a proposer if proposers are not allowed', () => {
    mockRole('nestedOwner', { isProposer: true })

    const { getByText } = renderButton({ allowProposer: false })

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should give a non-owner on the right network the not-owner reason', () => {
    mockRole('nonOwner')

    const { getByText, getByLabelText } = renderButton({ checkNetwork: true })

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText(NOT_OWNER)).toBeInTheDocument()
  })

  it('should ignore the wrong network when the network is not checked', () => {
    mockRole('wrongChain')

    const { getByText } = renderButton()

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button without a tooltip when noTooltip is set', () => {
    mockRole('nonOwner')

    const { getByText, queryByLabelText } = renderButton({ noTooltip: true })

    expect(getByText('Continue')).toBeDisabled()
    expect(queryByLabelText(NOT_OWNER)).not.toBeInTheDocument()
  })
})
