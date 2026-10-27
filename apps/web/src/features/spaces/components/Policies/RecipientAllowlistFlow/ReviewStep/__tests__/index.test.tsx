import { render, screen } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { PolicyBatch } from '../../../shared/buildPolicyBatch'
import * as contractsHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import * as policyContractsHook from '../../../shared/usePolicyContracts'
import * as nativeRecipientsHook from '../../hooks/useNativeAllowlistRecipients'
import type { RecipientAllowlistFormValues } from '../../types'
import ReviewRecipientAllowlistPolicy from '../index'

const CHAIN_ID = '11155111'
const SAFE = '0x1111111111111111111111111111111111111111'
const GUARD = '0x2222222222222222222222222222222222222222'
const ERC20_POLICY = '0x3333333333333333333333333333333333333333'
const NATIVE_POLICY = '0x4444444444444444444444444444444444444444'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const ALICE = '0x5555555555555555555555555555555555555555'
const BOB = '0x6666666666666666666666666666666666666666'

let captured: { build?: { batch?: PolicyBatch; error?: Error } } = {}
jest.mock('../../../GuardPolicyFlow/GuardPolicyReview', () => ({
  __esModule: true,
  default: (props: { build: { batch?: PolicyBatch; error?: Error }; summary: React.ReactNode }) => {
    captured = props
    return <div data-testid="guard-policy-review">{props.summary}</div>
  },
}))

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: () => ({ chainId: CHAIN_ID, safeAddress: SAFE }),
}))

const renderReview = (
  data: RecipientAllowlistFormValues,
  { isGuardSet = false, currentNativeRecipients = [] as `0x${string}`[] } = {},
) => {
  jest.spyOn(contractsHook, 'useGuardPolicyContracts').mockReturnValue({
    chainId: CHAIN_ID,
    safeAddress: SAFE,
    safePolicyGuard: GUARD,
    policyContract: ERC20_POLICY,
    fallbackPolicy: undefined,
    multiSendDefaults: undefined,
    currentGuard: isGuardSet ? GUARD : undefined,
    currentModuleGuard: isGuardSet ? GUARD : undefined,
    isGuardSet,
    isUnknownGuard: false,
    isUnsupportedVersion: false,
    isLoading: false,
  })
  jest.spyOn(policyContractsHook, 'usePolicyContracts').mockReturnValue({ policyContract: NATIVE_POLICY })
  jest
    .spyOn(nativeRecipientsHook, 'useNativeAllowlistRecipients')
    .mockReturnValue({ recipients: currentNativeRecipients, isLoading: false })

  return render(
    <TxFlowContext.Provider value={{ data } as never}>
      <ReviewRecipientAllowlistPolicy onSubmit={jest.fn()} />
    </TxFlowContext.Provider>,
  )
}

describe('ReviewRecipientAllowlistPolicy', () => {
  beforeEach(() => {
    captured = {}
  })
  afterEach(() => jest.restoreAllMocks())

  it('applies the allowlist at once on a Safe without the policy guard', () => {
    renderReview({ tokens: [{ address: USDC }], recipients: [{ address: ALICE }] })

    expect(captured.build?.batch?.mode).toBe('immediate')
    expect(captured.build?.batch?.configurations[0]).toMatchObject({ target: USDC, policy: ERC20_POLICY })
  })

  it('requests the allowlist on a Safe that already has the policy guard', () => {
    renderReview({ tokens: [{ address: USDC }], recipients: [{ address: ALICE }] }, { isGuardSet: true })

    expect(captured.build?.batch?.mode).toBe('request')
    expect(captured.build?.batch?.txs).toHaveLength(1)
  })

  it('leaves out rows that never got an address', () => {
    renderReview({ tokens: [{ address: USDC }, { address: '' }], recipients: [{ address: ALICE }, { address: '' }] })

    expect(captured.build?.batch?.configurations).toHaveLength(1)
  })

  it('names the native recipients the allowlist revokes', () => {
    renderReview(
      { tokens: [{ address: ZERO_ADDRESS }], recipients: [{ address: ALICE }] },
      { currentNativeRecipients: [ALICE, BOB] },
    )

    expect(screen.getByTestId('recipient-allowlist-summary-revoked')).toBeInTheDocument()
    expect(captured.build?.batch?.configurations.map((c) => c.policy)).toEqual([NATIVE_POLICY, ZERO_ADDRESS])
  })
})
