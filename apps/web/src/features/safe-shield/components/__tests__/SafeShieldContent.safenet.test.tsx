import { render, screen, waitFor } from '@/tests/test-utils'
import { SafeShieldContent } from '../SafeShieldContent'
import { TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { DetailedExecutionInfoType } from '@safe-global/store/gateway/types'
import { CheckStatus } from '@safe-global/utils/features/safenet-checks'
import { useSafenetCheck } from '@safe-global/utils/features/safenet-checks/hooks'
import { buildBenignSnapshot, buildCheckView } from '@safe-global/utils/features/safenet-checks/builders'
import * as useChainsModule from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

// The real lazy feature chunk mounts inside the widget; only the chain read is mocked.
// A missing feature.tsx registry member cannot be caught by the stubbed widget test.
jest.mock('@safe-global/utils/features/safenet-checks/hooks', () => ({
  ...jest.requireActual('@safe-global/utils/features/safenet-checks/hooks'),
  useSafenetCheck: jest.fn(),
}))

const HASH = `0x${'ef'.repeat(32)}`
const TX_ID = `multisig_0x0000000000000000000000000000000000000123_${HASH}`

const emptyAnalysis: [undefined, undefined, boolean] = [undefined, undefined, false]

describe('SafeShieldContent Safenet section integration', () => {
  let hasFeatureSpy: jest.SpyInstance
  beforeAll(() => {
    hasFeatureSpy = jest
      .spyOn(useChainsModule, 'useHasFeature')
      .mockImplementation((feature) => feature === FEATURES.SAFENET_CHECKS)
  })
  afterAll(() => {
    hasFeatureSpy.mockRestore()
  })

  it('renders the check section through the lazy feature for a flow with a txId', async () => {
    const mocked = useSafenetCheck as jest.MockedFunction<typeof useSafenetCheck>
    mocked.mockReturnValue(
      buildCheckView({
        snapshot: buildBenignSnapshot({ safeTxHash: HASH as `0x${string}` }),
        status: CheckStatus.BENIGN,
        publicStatus: CheckStatus.BENIGN,
      }),
    )
    const txDetails = {
      detailedExecutionInfo: { type: DetailedExecutionInfoType.MULTISIG, submittedAt: 1_700_000_000_000 },
    } as unknown as TransactionDetails

    render(
      <TxFlowContext.Provider value={{ txId: TX_ID, txDetails } as TxFlowContextType}>
        <SafeShieldContent
          recipient={emptyAnalysis}
          contract={emptyAnalysis}
          threat={emptyAnalysis}
          deadlock={emptyAnalysis}
        />
      </TxFlowContext.Provider>,
    )

    // The testid alone distinguishes the real mount from the null stub. Cold
    // CI runners can take seconds to transform the chunk's module graph.
    await waitFor(() => expect(screen.getByTestId('safenet-checks-section')).toBeInTheDocument(), {
      timeout: 10_000,
    })
  }, 15_000)
})
