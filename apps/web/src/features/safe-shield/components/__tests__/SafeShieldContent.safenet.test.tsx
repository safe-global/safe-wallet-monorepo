import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { RecipientAnalysisBuilder } from '@safe-global/utils/features/safe-shield/builders'
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

  const renderContent = (props: { hasProFeatures?: boolean; isSafePro?: boolean } = {}) => {
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
          recipient={RecipientAnalysisBuilder.knownRecipient(faker.finance.ethereumAddress()).build()}
          contract={emptyAnalysis}
          threat={emptyAnalysis}
          deadlock={emptyAnalysis}
          {...props}
        />
      </TxFlowContext.Provider>,
    )
  }

  // Cold CI runners can take seconds to transform the lazy chunk's module graph.
  const timeout = { timeout: 10_000 }

  it('shows the check in the Pro block with a plan', async () => {
    renderContent()

    const section = await screen.findByTestId('safenet-checks-section', {}, timeout)
    expect(screen.getByTestId('pro-checks-section')).toContainElement(section)
  }, 15_000)

  it('shows the check locked in the Pro block without a plan', async () => {
    renderContent({ hasProFeatures: false })

    const locked = await screen.findByTestId('safenet-checks-locked', {}, timeout)
    expect(screen.getByTestId('pro-checks-section')).toContainElement(locked)
  }, 15_000)

  it('lists the check among the open checks when Safe Pro is off', async () => {
    renderContent({ isSafePro: false })

    const section = await screen.findByTestId('safenet-checks-section', {}, timeout)
    expect(screen.getByTestId('open-checks-list')).toContainElement(section)
  }, 15_000)
})
