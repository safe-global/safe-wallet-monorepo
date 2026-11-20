import { faker } from '@faker-js/faker'
import type { Transaction } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { executionInfoBuilder, safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { mockRole } from '@/tests/mocks/roles'
import { advanceClock, renderOnFakeClock, screen } from '@/tests/test-utils'
import { PendingStatus } from '@/store/pendingTxsSlice'
import QueueActions from './QueueActions'

jest.mock('@/hooks/wallets/useWallet')
jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/hooks/useIsWrongChain')
jest.mock('@/hooks/useProposers')
jest.mock('@/hooks/useIsNestedSafeOwner')
jest.mock('@/hooks/coreSDK/safeCoreSDK')
jest.mock('@/hooks/useSafeInfo')
jest.mock('@/hooks/useNestedSafeOwners', () => ({ useNestedSafeOwners: () => [] }))
jest.mock('@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary', () => ({
  ...jest.requireActual('@/features/spending-limits/public/hooks/useIsOnlySpendingLimitBeneficiary'),
  __esModule: true,
  default: jest.fn(),
}))
jest.mock('@/features/swap/public/hooks/useIsExpiredSwap', () => ({
  __esModule: true,
  default: () => false,
}))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [], loading: false }),
  useChain: () => undefined,
  useCurrentChain: () => undefined,
  useHasFeature: (feature: string) =>
    feature === jest.requireActual('@safe-global/utils/utils/chains').FEATURES.SPEED_UP_TX,
}))

const SECONDS_STUCK = 20

const awaitingExecution = (): Transaction =>
  safeTxSummaryBuilder()
    .with({
      txStatus: 'AWAITING_EXECUTION',
      executionInfo: executionInfoBuilder().with({ missingSigners: [] }).build(),
    })
    .build()

const processingTx = (tx: Transaction, signerAddress: string, submittedAt: number) => ({
  [tx.id]: {
    status: PendingStatus.PROCESSING,
    signerAddress,
    submittedAt,
    txHash: faker.string.hexadecimal({ length: 64 }),
    gasLimit: '100000',
    signerNonce: 1,
  } as never,
})

describe('QueueActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo({ deployed: true })
    jest.useFakeTimers().setSystemTime(new Date(2026, 10, 20, 12, 0, 0))
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  const renderStuckExecution = () => {
    const wallet = mockRole('owner')
    const tx = awaitingExecution()

    return renderOnFakeClock(<QueueActions tx={tx} dense />, {
      initialReduxState: {
        pendingTxs: processingTx(tx, wallet?.address ?? '', Date.now() - SECONDS_STUCK * 1000),
      },
    })
  }

  it('shows Speed up for an execution the signer has been waiting on for a while', async () => {
    renderStuckExecution()
    await advanceClock(1000)

    expect(await screen.findByRole('button', { name: 'Speed up' }, { timeout: 5000 })).toBeInTheDocument()
  })

  it('opens the speed-up dialog when Speed up is clicked', async () => {
    const { user } = renderStuckExecution()
    await advanceClock(1000)

    await user.click(await screen.findByRole('button', { name: 'Speed up' }, { timeout: 5000 }))

    expect(await screen.findByText('Speed up transaction', {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
