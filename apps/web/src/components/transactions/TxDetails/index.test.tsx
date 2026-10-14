import { http, HttpResponse } from 'msw'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { CheckStatus, type Hex } from '@safe-global/utils/features/safenet-checks'
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

const renderDetails = (safenetEnabled: boolean) => {
  const execution = multisigExecutionDetailsBuilder().build()
  jest.mocked(useSafenetCheck).mockReturnValue(
    buildCheckView({
      snapshot: buildBenignSnapshot({ safeTxHash: execution.safeTxHash as Hex }),
      status: CheckStatus.BENIGN,
      publicStatus: CheckStatus.BENIGN,
    }),
  )
  jest
    .spyOn(useChainsModule, 'useHasFeature')
    .mockImplementation((feature) => safenetEnabled && feature === FEATURES.SAFENET_CHECKS)
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () =>
      HttpResponse.json(transactionDetailsBuilder().with({ detailedExecutionInfo: execution }).build()),
    ),
  )

  render(<TxDetails txSummary={safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()} />)
}

describe('TxDetails Safenet card', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows the card when the flag is on', async () => {
    renderDetails(true)

    expect(await screen.findByTestId('safenet-details-card')).toBeInTheDocument()
  })

  it('shows no card when the flag is off', async () => {
    renderDetails(false)

    expect(await screen.findByTestId('transaction-actions-list')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-details-card')).not.toBeInTheDocument()
  })
})
