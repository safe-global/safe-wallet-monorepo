import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { render } from '@/tests/test-utils'
import CheckWallet from '.'
import { useIsOnlySpendingLimitBeneficiary } from '@/features/spending-limits'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import useWallet from '@/hooks/wallets/useWallet'
import { chainBuilder } from '@/tests/builders/chains'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import type Safe from '@safe-global/protocol-kit'

const mockWalletAddress = faker.finance.ethereumAddress()
// mock useWallet
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    address: mockWalletAddress,
  })),
}))

// mock useIsSafeOwner
jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

// mock useIsOnlySpendingLimitBeneficiary
jest.mock('@/features/spending-limits', () => ({
  ...jest.requireActual('@/features/spending-limits'),
  useIsOnlySpendingLimitBeneficiary: jest.fn(() => false),
}))

// mock useCurrentChain
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useCurrentChain: jest.fn(() => chainBuilder().build()),
}))

// mock useIsWrongChain
jest.mock('@/hooks/useIsWrongChain', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  useIsWalletProposer: jest.fn(() => false),
}))

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => {
    const safeAddress = faker.finance.ethereumAddress()
    return {
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ deployed: true })
        .build(),
    }
  }),
}))

jest.mock('@/hooks/useNestedSafeOwners')
const mockUseNestedSafeOwners = useNestedSafeOwners as jest.MockedFunction<typeof useNestedSafeOwners>

jest.mock('@/hooks/coreSDK/safeCoreSDK')
const mockUseSafeSdk = useSafeSDK as jest.MockedFunction<typeof useSafeSDK>

const renderButton = () =>
  render(<CheckWallet checkNetwork={false}>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>)

describe('CheckWallet', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeSdk.mockReturnValue({} as unknown as Safe)
    mockUseNestedSafeOwners.mockReturnValue([])
  })

  it('renders correctly when the wallet is connected to the right chain and is an owner', () => {
    const { getByText } = renderButton()

    // Check that the button is enabled
    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button when the wallet is not connected', () => {
    ;(useWallet as jest.MockedFunction<typeof useWallet>).mockReturnValueOnce(null)

    const { getByText, getByLabelText } = renderButton()

    // Check that the button is disabled
    expect(getByText('Continue')).toBeDisabled()

    // Check the tooltip text
    expect(getByLabelText('Please connect your wallet')).toBeInTheDocument()
  })

  it('should disable the button when the wallet is connected to the right chain but is not an owner', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText('Your connected wallet is not a signer of this Safe Account')).toBeInTheDocument()
  })

  it('should be disabled when connected to the wrong network', () => {
    ;(useIsWrongChain as jest.MockedFunction<typeof useIsWrongChain>).mockReturnValue(true)
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(true)

    const renderButtonWithNetworkCheck = () =>
      render(<CheckWallet checkNetwork={true}>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>)

    const { getByText } = renderButtonWithNetworkCheck()

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should not disable the button for non-owner spending limit benificiaries', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)
    ;(
      useIsOnlySpendingLimitBeneficiary as jest.MockedFunction<typeof useIsOnlySpendingLimitBeneficiary>
    ).mockReturnValueOnce(true)

    const { getByText } = render(
      <CheckWallet allowSpendingLimit>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>,
    )

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should not disable the button for proposers', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)
    ;(useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>).mockReturnValueOnce(true)

    const { getByText } = renderButton()

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button for proposers if specified via flag', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)
    ;(useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>).mockReturnValueOnce(true)

    const { getByText } = render(
      <CheckWallet allowProposer={false}>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>,
    )

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should not disable the button for proposers that are also owners', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(true)
    ;(useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>).mockReturnValueOnce(true)

    const { getByText } = render(
      <CheckWallet allowProposer={false}>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>,
    )

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should disable the button for counterfactual Safes', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(true)

    const safeAddress = faker.finance.ethereumAddress()
    const mockSafeInfo = {
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ deployed: false })
        .build(),
    }

    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValueOnce(
      mockSafeInfo as unknown as ReturnType<typeof useSafeInfo>,
    )

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText('You need to activate the Safe before transacting')).toBeInTheDocument()
  })

  it('should enable the button for counterfactual Safes if allowed', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(true)

    const safeAddress = faker.finance.ethereumAddress()
    const mockSafeInfo = {
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ deployed: false })
        .build(),
    }

    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValueOnce(
      mockSafeInfo as unknown as ReturnType<typeof useSafeInfo>,
    )

    const { getByText } = render(
      <CheckWallet allowUndeployedSafe>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>,
    )

    expect(getByText('Continue')).toBeEnabled()
  })

  it('should allow non-owners if specified', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)

    const { getByText } = render(
      <CheckWallet allowNonOwner>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>,
    )

    expect(getByText('Continue')).not.toBeDisabled()
  })

  it('should not allow non-owners that have a spending limit without allowing spending limits', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)
    ;(
      useIsOnlySpendingLimitBeneficiary as jest.MockedFunction<typeof useIsOnlySpendingLimitBeneficiary>
    ).mockReturnValueOnce(true)

    const { getByText } = render(<CheckWallet>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>)

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should disable the button if SDK is not initialized and safe is loaded', () => {
    mockUseSafeSdk.mockReturnValue(undefined)

    const mockSafeInfo = {
      safeLoaded: true,
      safe: extendedSafeInfoBuilder(),
    }

    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValueOnce(
      mockSafeInfo as unknown as ReturnType<typeof useSafeInfo>,
    )

    const { getByText, getByLabelText } = render(
      <CheckWallet>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>,
    )

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText('SDK is not initialized yet'))
  })

  it('should not disable the button if SDK is not initialized and safe is not loaded', () => {
    mockUseSafeSdk.mockReturnValue(undefined)

    const safeAddress = faker.finance.ethereumAddress()
    const mockSafeInfo = {
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .with({ deployed: true })
        .build(),
      safeLoaded: false,
    }

    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValueOnce(
      mockSafeInfo as unknown as ReturnType<typeof useSafeInfo>,
    )

    const { queryByText } = render(<CheckWallet>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>)

    expect(queryByText('Continue')).not.toBeDisabled()
  })

  it('should allow nested Safe owners', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValueOnce(false)
    mockUseNestedSafeOwners.mockReturnValue([faker.finance.ethereumAddress()])

    const { container } = render(<CheckWallet>{(isOk) => <button disabled={!isOk}>Continue</button>}</CheckWallet>)
    console.log(container.innerHTML)
    expect(container.querySelector('button')).not.toBeDisabled()
  })
})
