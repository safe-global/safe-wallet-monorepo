import { CheckStatus, UNVERIFIED_ATTESTATION, type Hex } from '@safe-global/utils/features/safenet-checks'
import { buildBenignSnapshot, buildSnapshot } from '@safe-global/utils/features/safenet-checks/builders'
import { useGetSafenetCheckQuery } from '@safe-global/store/safenet/safenetCheckApi'
import { checkKey } from '@safe-global/store/safenet/safenetCheckSlice'
import { FEATURES } from '@safe-global/utils/utils/chains'
import * as useChainsModule from '@/hooks/useChains'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { render, screen, waitFor } from '@/tests/test-utils'
import DecodedTxs from '../DecodedTxs'

jest.mock('@safe-global/store/safenet/safenetCheckApi', () => ({
  ...jest.requireActual('@safe-global/store/safenet/safenetCheckApi'),
  useGetSafenetCheckQuery: jest.fn(),
}))

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
    return { data, error: undefined, isLoading: false, isFetching: false, refetch: jest.fn() }
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
