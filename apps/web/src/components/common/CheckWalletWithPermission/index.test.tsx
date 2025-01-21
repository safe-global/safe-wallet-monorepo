import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import { render } from '@/tests/test-utils'
import CheckWalletWithPermission from './index'
import useIsWrongChain from '@/hooks/useIsWrongChain'
import useWallet from '@/hooks/wallets/useWallet'
import { chainBuilder } from '@/tests/builders/chains'
import { faker } from '@faker-js/faker'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useSafeInfo from '@/hooks/useSafeInfo'
import type Safe from '@safe-global/protocol-kit'
import * as useHasPermission from '@/permissions/hooks/useHasPermission'
import { Permission } from '@/permissions/types'

const mockWalletAddress = faker.finance.ethereumAddress()
// mock useWallet
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    address: mockWalletAddress,
  })),
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

jest.mock('@/hooks/coreSDK/safeCoreSDK')
const mockUseSafeSdk = useSafeSDK as jest.MockedFunction<typeof useSafeSDK>

const renderButton = () =>
  render(
    <CheckWalletWithPermission permission={Permission.SignTransaction} checkNetwork={false}>
      {(isOk) => <button disabled={!isOk}>Continue</button>}
    </CheckWalletWithPermission>,
  )

describe('CheckWalletWithPermission', () => {
  const useHasPermissionSpy = jest.spyOn(useHasPermission, 'useHasPermission')

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeSdk.mockReturnValue({} as unknown as Safe)
    useHasPermissionSpy.mockReturnValue(true)
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

  it('should disable the button when the current user does not have the specified permission', () => {
    useHasPermissionSpy.mockReturnValue(false)

    const { getByText, getByLabelText } = renderButton()

    expect(getByText('Continue')).toBeDisabled()
    expect(getByLabelText('Your connected wallet is not a signer of this Safe Account')).toBeInTheDocument()

    expect(useHasPermissionSpy).toHaveBeenCalledTimes(1)
    expect(useHasPermissionSpy).toHaveBeenCalledWith(Permission.SignTransaction)
  })

  it('should be disabled when connected to the wrong network', () => {
    ;(useIsWrongChain as jest.MockedFunction<typeof useIsWrongChain>).mockReturnValue(true)

    const renderButtonWithNetworkCheck = () =>
      render(
        <CheckWalletWithPermission permission={Permission.SignTransaction} checkNetwork={true}>
          {(isOk) => <button disabled={!isOk}>Continue</button>}
        </CheckWalletWithPermission>,
      )

    const { getByText } = renderButtonWithNetworkCheck()

    expect(getByText('Continue')).toBeDisabled()
  })

  it('should disable the button for counterfactual Safes', () => {
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
      <CheckWalletWithPermission permission={Permission.SignTransaction} allowUndeployedSafe>
        {(isOk) => <button disabled={!isOk}>Continue</button>}
      </CheckWalletWithPermission>,
    )

    expect(getByText('Continue')).toBeEnabled()
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
      <CheckWalletWithPermission permission={Permission.SignTransaction}>
        {(isOk) => <button disabled={!isOk}>Continue</button>}
      </CheckWalletWithPermission>,
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

    const { queryByText } = render(
      <CheckWalletWithPermission permission={Permission.SignTransaction}>
        {(isOk) => <button disabled={!isOk}>Continue</button>}
      </CheckWalletWithPermission>,
    )

    expect(queryByText('Continue')).not.toBeDisabled()
  })
})
