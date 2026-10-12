import { http, HttpResponse } from 'msw'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { CheckStatus, type Hex, type SafenetCheckSnapshot } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildBenignSnapshot, buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { render, screen } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import * as useChainsModule from '@/hooks/useChains'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import TxDetails from './index'

jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const mockUseSafenetCheck = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>

const mockBenignCheck = (snapshot: Partial<SafenetCheckSnapshot> = {}) =>
  mockUseSafenetCheck.mockReturnValue(
    buildCheckView({
      snapshot: buildBenignSnapshot(snapshot),
      status: CheckStatus.BENIGN,
      publicStatus: CheckStatus.BENIGN,
    }),
  )

const setSafenetFlag = (enabled: boolean) =>
  jest
    .spyOn(useChainsModule, 'useHasFeature')
    .mockImplementation((feature) => enabled && feature === FEATURES.SAFENET_CHECKS)

const serveDetails = (details: TransactionDetails) =>
  server.use(http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () => HttpResponse.json(details)))

const renderDetails = () => {
  const txSummary = safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()
  render(<TxDetails txSummary={txSummary} />)
}

describe('TxDetails Safenet card', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the card for a multisig transaction when the flag is on', async () => {
    const execution = multisigExecutionDetailsBuilder().build()
    mockBenignCheck({ safeTxHash: execution.safeTxHash as Hex })
    setSafenetFlag(true)
    serveDetails(transactionDetailsBuilder().with({ detailedExecutionInfo: execution }).build())

    renderDetails()

    expect(await screen.findByTestId('safenet-details-card')).toBeInTheDocument()
  })

  it('shows no card when the flag is off', async () => {
    const execution = multisigExecutionDetailsBuilder().build()
    mockBenignCheck({ safeTxHash: execution.safeTxHash as Hex })
    setSafenetFlag(false)
    serveDetails(transactionDetailsBuilder().with({ detailedExecutionInfo: execution }).build())

    renderDetails()

    expect(await screen.findByTestId('transaction-actions-list')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-card')).not.toBeInTheDocument()
    expect(mockUseSafenetCheck).not.toHaveBeenCalledWith(execution.safeTxHash, expect.anything(), expect.anything())
  })
})
