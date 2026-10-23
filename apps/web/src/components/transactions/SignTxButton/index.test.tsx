import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { render, screen } from '@/tests/test-utils'
import SignTxButton from '.'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { faker } from '@faker-js/faker'
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

const txAwaitingSignatureFrom = (signerAddress: string) =>
  safeTxSummaryBuilder()
    .with({
      executionInfo: executionInfoBuilder()
        .with({
          type: DetailedExecutionInfoType.MULTISIG,
          confirmationsRequired: 3,
          confirmationsSubmitted: 1,
          missingSigners: [{ value: signerAddress }, { value: faker.finance.ethereumAddress() }],
        })
        .build(),
    })
    .build()

describe('SignTxButton', () => {
  const txAwaitingAnotherSigner = txAwaitingSignatureFrom(faker.finance.ethereumAddress())

  const getConfirmButton = () => screen.getByRole('button', { name: 'Confirm' })

  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
  })

  it('should be disabled without any wallet connected', () => {
    mockRole('disconnected')

    render(<SignTxButton txSummary={txAwaitingAnotherSigner} />)

    expect(getConfirmButton()).toBeDisabled()
  })

  it('should be disabled with non-owner connected', () => {
    mockRole('nonOwner')

    render(<SignTxButton txSummary={txAwaitingAnotherSigner} />)

    expect(getConfirmButton()).toBeDisabled()
  })

  it('should be enabled with missing signer connected', () => {
    const wallet = mockRole('owner')

    render(<SignTxButton txSummary={txAwaitingSignatureFrom(wallet?.address ?? '')} />)

    expect(getConfirmButton()).toBeEnabled()
  })

  it('should be disabled for a proposer who is not a missing signer', () => {
    mockRole('proposer')

    render(<SignTxButton txSummary={txAwaitingAnotherSigner} />)

    expect(getConfirmButton()).toBeDisabled()
  })
})
