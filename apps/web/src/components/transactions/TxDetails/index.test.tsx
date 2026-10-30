import { http, HttpResponse } from 'msw'
import { TransactionStatus } from '@safe-global/store/gateway/types'
import { CheckStatus, type Hex } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildBenignSnapshot, buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import { basicTypesActions, multiSendTxDataBuilder, multiSendTxInfo } from '@/tests/builders/dataDecoded'
import { server } from '@/tests/server'
import { GATEWAY_URL } from '@/config/gateway'
import * as useChainsModule from '@/hooks/useChains'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { safeTxSummaryBuilder } from '@/tests/builders/safeTx'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
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

describe('TxDetails decoded data', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders every action of a batch that uses every ABI type', async () => {
    const actions = basicTypesActions()
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () =>
        HttpResponse.json(
          transactionDetailsBuilder()
            .with({
              txInfo: multiSendTxInfo(actions.length),
              txData: multiSendTxDataBuilder(actions).build(),
              detailedExecutionInfo: multisigExecutionDetailsBuilder().build(),
            })
            .build(),
        ),
      ),
    )

    render(<TxDetails txSummary={safeTxSummaryBuilder().build()} />)
    fireEvent.click(await screen.findByTestId('expande-all-btn'))

    expect(screen.getAllByTestId('action-item')).toHaveLength(actions.length)
    expect(screen.queryByText('Error parsing data')).not.toBeInTheDocument()
  })
})

describe('TxDetails proposer', () => {
  const safe = extendedSafeInfoBuilder().with({ chainId: '1' }).build()
  const proposerAddress = checksumAddress(faker.finance.ethereumAddress())
  const proposedByDelegateAlert =
    'This transaction was created by a proposer. Please review and either confirm or reject it.'

  const renderProposedTx = (delegates: string[]) => {
    const delegatesServed = jest.fn()
    jest.spyOn(useChainsModule, 'useHasFeature').mockReturnValue(false)
    const execution = multisigExecutionDetailsBuilder()
      .with({
        proposer: { value: proposerAddress },
        proposedByDelegate: null,
        confirmationsRequired: 2,
        confirmations: [],
      })
      .build()
    server.use(
      http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, () =>
        HttpResponse.json(transactionDetailsBuilder().with({ detailedExecutionInfo: execution }).build()),
      ),
      http.get(`${GATEWAY_URL}/v2/chains/:chainId/delegates`, () => {
        delegatesServed()
        return HttpResponse.json({
          count: delegates.length,
          next: null,
          previous: null,
          results: delegates.map((delegate) => ({
            safe: safe.address.value,
            delegate,
            delegator: checksumAddress(faker.finance.ethereumAddress()),
            label: 'Proposer',
          })),
        })
      }),
    )

    render(<TxDetails txSummary={safeTxSummaryBuilder().with({ txStatus: TransactionStatus.SUCCESS }).build()} />, {
      initialReduxState: { safeInfo: { loading: false, loaded: true, data: safe } },
    })

    return delegatesServed
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('marks a transaction whose proposer is a delegate of the Safe as proposed', async () => {
    renderProposedTx([proposerAddress])

    expect(await screen.findByText(proposedByDelegateAlert)).toBeInTheDocument()
    expect(screen.getByText('Proposed')).toBeInTheDocument()
    expect(screen.queryByText('Created')).not.toBeInTheDocument()
  })

  it('marks a transaction created by someone who is not a delegate as created', async () => {
    const delegatesServed = renderProposedTx([checksumAddress(faker.finance.ethereumAddress())])

    await waitFor(() => expect(delegatesServed).toHaveBeenCalled())
    expect(await screen.findByText('Created')).toBeInTheDocument()
    expect(screen.queryByText('Proposed')).not.toBeInTheDocument()
    expect(screen.queryByText(proposedByDelegateAlert)).not.toBeInTheDocument()
  })
})

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
