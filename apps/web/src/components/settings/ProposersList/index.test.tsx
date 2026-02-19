import { render } from '@/tests/test-utils'
import ProposersList from '.'
import { faker } from '@faker-js/faker'
import useProposers from '@/hooks/useProposers'
import { useHasFeature } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useIsWalletProposer } from '@/hooks/useProposers'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type Safe from '@safe-global/protocol-kit'

const mockWalletAddress = faker.finance.ethereumAddress()

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    address: mockWalletAddress,
  })),
}))

jest.mock('@/hooks/useIsSafeOwner', () => ({
  __esModule: true,
  default: jest.fn(() => true),
}))

jest.mock('@/hooks/useProposers', () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: { results: [] } })),
  useIsWalletProposer: jest.fn(() => false),
}))

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useHasFeature: jest.fn(() => true),
}))

jest.mock('@/features/spending-limits', () => ({
  __esModule: true,
  useIsOnlySpendingLimitBeneficiary: jest.fn(() => false),
}))

jest.mock('@/hooks/useIsWrongChain', () => ({
  __esModule: true,
  default: jest.fn(() => false),
}))

jest.mock('@/hooks/useNestedSafeOwners')
const mockUseNestedSafeOwners = useNestedSafeOwners as jest.MockedFunction<typeof useNestedSafeOwners>

jest.mock('@/hooks/coreSDK/safeCoreSDK')
const mockUseSafeSdk = useSafeSDK as jest.MockedFunction<typeof useSafeSDK>

const mockSafeAddress = faker.finance.ethereumAddress()

jest.mock('@/hooks/useSafeInfo', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    safeAddress: mockSafeAddress,
    safe: {
      address: { value: mockSafeAddress },
      chainId: '1',
      owners: [{ value: mockWalletAddress }],
      threshold: 1,
      deployed: true,
    },
    safeLoaded: true,
  })),
}))

describe('ProposersList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseSafeSdk.mockReturnValue({} as unknown as Safe)
    mockUseNestedSafeOwners.mockReturnValue([])
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValue(true)
    ;(useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>).mockReturnValue(false)
    ;(useHasFeature as jest.MockedFunction<typeof useHasFeature>).mockReturnValue(true)
    ;(useWallet as jest.MockedFunction<typeof useWallet>).mockReturnValue({
      address: mockWalletAddress,
    } as ReturnType<typeof useWallet>)
    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: mockSafeAddress } })
        .with({ deployed: true })
        .with({ owners: [{ value: mockWalletAddress }] })
        .build(),
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfo>)
    ;(useProposers as jest.MockedFunction<typeof useProposers>).mockReturnValue({
      data: { results: [] },
    } as unknown as ReturnType<typeof useProposers>)
  })

  it('should enable the Add proposer button for direct Safe owners', () => {
    const { getByTestId } = render(<ProposersList />)

    const button = getByTestId('add-proposer-btn')
    expect(button).not.toBeDisabled()
  })

  it('should enable the Add proposer button when user is a nested Safe owner', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValue(false)
    mockUseNestedSafeOwners.mockReturnValue([faker.finance.ethereumAddress()])

    const { getByTestId } = render(<ProposersList />)

    const button = getByTestId('add-proposer-btn')
    expect(button).not.toBeDisabled()
  })

  it('should disable the Add proposer button when user is only a proposer', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValue(false)
    ;(useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>).mockReturnValue(true)
    mockUseNestedSafeOwners.mockReturnValue([])

    const { getByTestId } = render(<ProposersList />)

    const button = getByTestId('add-proposer-btn')
    expect(button).toBeDisabled()
  })

  it('should disable the Add proposer button when user has no relationship to the Safe', () => {
    ;(useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>).mockReturnValue(false)
    ;(useIsWalletProposer as jest.MockedFunction<typeof useIsWalletProposer>).mockReturnValue(false)
    mockUseNestedSafeOwners.mockReturnValue([])

    const { getByTestId, getByLabelText } = render(<ProposersList />)

    const button = getByTestId('add-proposer-btn')
    expect(button).toBeDisabled()
    expect(getByLabelText('Your connected wallet is not a signer of this Safe Account')).toBeInTheDocument()
  })

  it('should disable the Add proposer button when Safe is undeployed', () => {
    ;(useSafeInfo as jest.MockedFunction<typeof useSafeInfo>).mockReturnValue({
      safeAddress: mockSafeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: mockSafeAddress } })
        .with({ deployed: false })
        .with({ owners: [{ value: mockWalletAddress }] })
        .build(),
      safeLoaded: true,
    } as unknown as ReturnType<typeof useSafeInfo>)

    const { getByTestId } = render(<ProposersList />)

    const button = getByTestId('add-proposer-btn')
    expect(button).toBeDisabled()
  })
})
