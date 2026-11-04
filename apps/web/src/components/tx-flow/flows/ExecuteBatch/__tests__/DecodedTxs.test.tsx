import { faker } from '@faker-js/faker'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TransactionInfoType } from '@safe-global/store/gateway/types'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { checkKey } from '@safe-global/store/safenet/safenetCheckSlice'
import { CheckStatus, UNVERIFIED_ATTESTATION, type Hex } from '@safe-global/utils/features/safenet-checks'
import { buildBenignSnapshot, buildSnapshot } from '@safe-global/utils/features/safenet-checks/builders'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import * as useChainsModule from '@/hooks/useChains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import {
  multisigExecutionDetailsBuilder,
  transactionDataBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import DecodedTxs from '../DecodedTxs'

jest.mock('@safe-global/store/safenet/safenetCheckApi', () => ({
  ...jest.requireActual('@safe-global/store/safenet/safenetCheckApi'),
  useGetSafenetCheckQuery: jest.fn(),
}))

const ONE_ETH = '1000000000000000000'
const APPROVE_SELECTOR = '0x095ea7b3'
const APPROVE_CALLDATA_BYTES = '68'

const randomAddress = () => checksumAddress(faker.finance.ethereumAddress())

const nativeTransfer = (to: string): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txData: transactionDataBuilder()
        .with({ to: { value: to }, value: ONE_ETH })
        .build(),
    })
    .build()

const approveTx = (): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        to: { value: randomAddress() },
        dataSize: APPROVE_CALLDATA_BYTES,
        value: '0',
        isCancellation: false,
        methodName: 'approve',
      },
      txData: transactionDataBuilder()
        .with({ hexData: APPROVE_SELECTOR, dataDecoded: { method: 'approve', parameters: [] } })
        .build(),
    })
    .build()

const rejectionTx = (): TransactionDetails =>
  transactionDetailsBuilder()
    .with({
      txInfo: {
        type: TransactionInfoType.CUSTOM,
        to: { value: randomAddress() },
        dataSize: '0',
        value: '0',
        isCancellation: true,
        methodName: null,
      },
      txData: transactionDataBuilder().with({ hexData: '0x', dataDecoded: null }).build(),
    })
    .build()

const renderRows = async (txs: TransactionDetails[]) => {
  render(<DecodedTxs txs={txs} />)
  return screen.findAllByTestId('action-item')
}

describe('DecodedTxs', () => {
  it('renders nothing without transactions', () => {
    const { container } = render(<DecodedTxs txs={undefined} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the "Batched transactions" header and one numbered row per transaction', async () => {
    const rows = await renderRows([approveTx(), approveTx()])

    expect(screen.getByText('Batched transactions')).toBeInTheDocument()
    expect(rows.map((row) => row.textContent)).toEqual(['1approve', '2approve'])
  })

  it('labels a rejection without decoded data as an on-chain rejection', async () => {
    const [row] = await renderRows([rejectionTx()])

    expect(row).toHaveTextContent('On-chain rejection')
  })

  it('shows a native transfer as its amount and recipient', async () => {
    const recipient = randomAddress()

    const [row] = await renderRows([nativeTransfer(recipient)])

    expect(row).toHaveTextContent('Send1 ETH')
    expect(row).toHaveTextContent(shortenAddress(recipient))
  })

  it('numbers the rows without a gap for a transaction without data', async () => {
    const withoutData = transactionDetailsBuilder().with({ txData: null }).build()

    const rows = await renderRows([withoutData, approveTx()])

    expect(rows.map((row) => row.textContent)).toEqual(['1approve'])
  })

  it('opens and closes every row with "Expand all" and "Collapse all"', async () => {
    const rows = await renderRows([approveTx(), rejectionTx()])

    fireEvent.click(screen.getByRole('button', { name: 'Expand all' }))
    await waitFor(() => rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'true')))

    fireEvent.click(screen.getByRole('button', { name: 'Collapse all' }))
    await waitFor(() => rows.forEach((row) => expect(row).toHaveAttribute('aria-expanded', 'false')))
  })
})

const safe = extendedSafeInfoBuilder().build()
const hashOf = (index: number): Hex => `0x${String(index).repeat(64)}`
const batch = [1, 2, 3].map((index) =>
  transactionDetailsBuilder()
    .with({
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({ safeTxHash: hashOf(index) })
        .build(),
    })
    .build(),
)

const pinnedRisk = (hashes: Hex[]) =>
  Object.fromEntries(
    hashes.map((safeTxHash) => [
      checkKey({ safeTxHash, chainId: safe.chainId, safeAddress: safe.address.value }),
      { status: CheckStatus.MALICIOUS, atBlock: '1', verification: UNVERIFIED_ATTESTATION },
    ]),
  )

const renderBatch = (flagged: Hex[], safenetEnabled = true) => {
  jest
    .spyOn(useChainsModule, 'useHasFeature')
    .mockImplementation((feature) => safenetEnabled && feature === FEATURES.SAFENET_CHECKS)
  jest.mocked(useGetSafenetCheckQuery).mockImplementation(((identity: { safeTxHash: Hex }) => {
    const status = flagged.includes(identity.safeTxHash) ? CheckStatus.MALICIOUS : CheckStatus.BENIGN
    const data =
      status === CheckStatus.MALICIOUS
        ? buildSnapshot({ safeTxHash: identity.safeTxHash, status })
        : buildBenignSnapshot({ safeTxHash: identity.safeTxHash })
    return { currentData: data, error: undefined, isLoading: false, isFetching: false, refetch: jest.fn() }
  }) as unknown as typeof useGetSafenetCheckQuery)

  return render(<DecodedTxs txs={batch} />, {
    initialReduxState: {
      safeInfo: { loading: false, loaded: true, data: safe },
      safenetChecks: { pinned: pinnedRisk(flagged) },
    },
  })
}

describe('DecodedTxs Safenet flags', () => {
  afterEach(() => {
    jest.restoreAllMocks()
    jest.mocked(useGetSafenetCheckQuery).mockReset()
  })

  it('warns once with the count and marks each flagged transaction', async () => {
    renderBatch([hashOf(1), hashOf(3)])

    expect(await screen.findByTestId('safenet-batch-warning')).toHaveTextContent(
      'Safenet flagged 2 of these transactions. Review them before you execute.',
    )
    expect(screen.getAllByTestId('safenet-batch-warning')).toHaveLength(1)
    await waitFor(() => expect(screen.getAllByTestId('safenet-risk-chip')).toHaveLength(2))
  })

  it('uses the singular for a single flagged transaction', async () => {
    renderBatch([hashOf(2)])

    expect(await screen.findByTestId('safenet-batch-warning')).toHaveTextContent(
      'Safenet flagged 1 of these transactions. Review it before you execute.',
    )
    await waitFor(() => expect(screen.getAllByTestId('safenet-risk-chip')).toHaveLength(1))
  })

  it('shows neither a warning nor a chip when no transaction is flagged', async () => {
    renderBatch([])

    await waitFor(() => expect(useGetSafenetCheckQuery).toHaveBeenCalled())
    expect(screen.queryByTestId('safenet-batch-warning')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-risk-chip')).not.toBeInTheDocument()
  })

  it('shows nothing and reads nothing while the feature flag is off', async () => {
    renderBatch([hashOf(1)], false)

    expect(await screen.findByText('Batched transactions')).toBeInTheDocument()
    expect(screen.queryByTestId('safenet-batch-warning')).not.toBeInTheDocument()
    expect(screen.queryByTestId('safenet-risk-chip')).not.toBeInTheDocument()
    expect(useGetSafenetCheckQuery).not.toHaveBeenCalled()
  })
})
