import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import type { AddressInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, waitFor } from '@/tests/test-utils'
import SignTxButton from '.'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { faker } from '@faker-js/faker'
import useWallet, { useSigner } from '@/hooks/wallets/useWallet'
import { MockEip1193Provider } from '@/tests/mocks/providers'
import { setSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type Safe from '@safe-global/protocol-kit'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useIsSafeOwner')

describe('SignTxButton', () => {
  const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>
  const mockUseSigner = useSigner as jest.MockedFunction<typeof useSigner>
  const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
  const mockUseIsSafeOwner = useIsSafeOwner as jest.MockedFunction<typeof useIsSafeOwner>

  const testMissingSigners: AddressInfo[] = [
    {
      value: faker.finance.ethereumAddress(),
    },
    {
      value: faker.finance.ethereumAddress(),
    },
  ]
  const txSummary = safeTxSummaryBuilder()
    .with({
      executionInfo: executionInfoBuilder()
        .with({
          type: DetailedExecutionInfoType.MULTISIG,
          confirmationsRequired: 3,
          confirmationsSubmitted: 1,
          missingSigners: testMissingSigners,
        })
        .build(),
    })
    .build()

  beforeEach(() => {
    jest.clearAllMocks()

    const safeAddress = faker.finance.ethereumAddress()
    mockUseSafeInfo.mockReturnValue({
      safeAddress,
      safe: extendedSafeInfoBuilder()
        .with({ address: { value: safeAddress } })
        .build(),
      safeLoaded: true,
      safeLoading: false,
    })
  })

  it('should be disabled without any wallet connected', () => {
    const result = render(<SignTxButton txSummary={txSummary} />)
    expect(result.getByRole('button')).toBeDisabled()
  })
  it('should be disabled with non-owner connected', () => {
    mockUseWallet.mockReturnValue({
      address: faker.finance.ethereumAddress(),
      chainId: '1',
      label: 'MetaMask',
      provider: MockEip1193Provider,
    })

    mockUseSigner.mockReturnValue({
      address: faker.finance.ethereumAddress(),
      chainId: '1',
      provider: MockEip1193Provider,
    })

    mockUseIsSafeOwner.mockReturnValue(false)

    const result = render(<SignTxButton txSummary={txSummary} />)

    expect(result.getByRole('button')).toBeDisabled()
  })

  it('should be enabled with missing signer connected', async () => {
    mockUseWallet.mockReturnValue({
      address: testMissingSigners[0].value,
      chainId: '1',
      label: 'MetaMask',
      provider: MockEip1193Provider,
    })

    mockUseSigner.mockReturnValue({
      address: testMissingSigners[0].value,
      chainId: '1',
      provider: MockEip1193Provider,
    })
    mockUseIsSafeOwner.mockReturnValue(true)
    setSafeSDK({} as unknown as Safe)
    const result = render(<SignTxButton txSummary={txSummary} />)
    await waitFor(() => {
      expect(result.getByRole('button')).toBeEnabled()
    })
  })
})
