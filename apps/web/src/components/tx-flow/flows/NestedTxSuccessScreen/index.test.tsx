import { render } from '@/tests/test-utils'
import NestedTxSuccessScreen from '.'
import { PendingStatus } from '@/store/pendingTxsSlice'
import * as useChains from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const TX_ID = 'multisig_0x01_0x02'

const pendingTxs = {
  [TX_ID]: {
    status: PendingStatus.NESTED_SIGNING as const,
    chainId: '1',
    safeAddress: '0x0000000000000000000000000000000000000C11',
    signerAddress: '0x0000000000000000000000000000000000000A11',
    txHashOrParentSafeTxHash: `0x${'ab'.repeat(32)}`,
    nonce: 1,
  },
}

describe('NestedTxSuccessScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // The parent's approveHash is only sponsored on GTF (RELAY_FEE) chains.
  it('promises a gas-free relay on a GTF chain', () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => feature === FEATURES.GTF)

    const { getByText } = render(<NestedTxSuccessScreen txId={TX_ID} />, { initialReduxState: { pendingTxs } })

    expect(getByText(/No gas is needed/)).toBeInTheDocument()
  })

  it('does not promise a gas-free relay on a daily-limit chain', () => {
    jest.spyOn(useChains, 'useHasFeature').mockImplementation((feature) => feature === FEATURES.RELAYING)

    const { getByText, queryByText } = render(<NestedTxSuccessScreen txId={TX_ID} />, {
      initialReduxState: { pendingTxs },
    })

    expect(getByText(/Execute this approval from the parent Safe Account/)).toBeInTheDocument()
    expect(queryByText(/No gas is needed/)).not.toBeInTheDocument()
  })
})
