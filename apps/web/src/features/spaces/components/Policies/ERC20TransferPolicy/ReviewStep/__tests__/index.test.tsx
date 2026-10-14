import { render } from '@/tests/test-utils'
import type { ReactNode } from 'react'
import { PolicyType } from '@safe-global/store/gateway/policies/types'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import type { TokenAllowlistFormValues } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/types'
import * as contractsHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import { CHAIN_ID, SAFE_ADDRESS } from '../../../GuardPolicyFlow/guardPolicyStep.fixtures'
import ReviewTokenAllowlistPolicy from '../index'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const DAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F'
const RECIPIENT = '0xdeAD00000000000000000000000000000000DE01'
const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'

// The review's own job is what it hands down: the batch and the snapshot. Capture them.
let captured: Record<string, unknown> = {}
jest.mock('../../../GuardPolicyFlow/GuardPolicyReview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    captured = props
    return <div data-testid="guard-policy-review" />
  },
}))

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: () => ({ chainId: '11155111', safeAddress: '0x1111111111111111111111111111111111111111' }),
}))

jest.mock('../../../SpendingLimitFlow/hooks/useSpendingLimitTokenOptions', () => ({
  __esModule: true,
  default: () => ({
    options: [{ address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6, group: 'held' }],
  }),
}))

const renderReview = (values: Partial<TokenAllowlistFormValues>) => {
  jest.spyOn(contractsHook, 'useGuardPolicyContracts').mockReturnValue({
    chainId: CHAIN_ID,
    safeAddress: SAFE_ADDRESS as `0x${string}`,
    safePolicyGuard: GUARD as `0x${string}`,
    policyContract: POLICY as `0x${string}`,
    currentGuard: undefined,
    isGuardSet: false,
    isUnknownGuard: false,
    isLoading: false,
  })

  return render(
    <TxFlowContext.Provider
      value={{ data: { safe: `${CHAIN_ID}:${SAFE_ADDRESS}`, tokens: [], recipients: [], ...values } } as never}
    >
      {(<ReviewTokenAllowlistPolicy onSubmit={jest.fn()} />) as ReactNode}
    </TxFlowContext.Provider>,
  )
}

describe('ReviewTokenAllowlistPolicy', () => {
  beforeEach(() => {
    captured = {}
  })
  afterEach(() => jest.restoreAllMocks())

  it('builds the batch for the token withdraw policy', () => {
    renderReview({ tokens: [{ address: USDC }], recipients: [{ address: RECIPIENT }] })

    expect(captured.type).toBe(PolicyType.TokenWithdraw)
    expect(captured.build).toHaveProperty('batch')
  })

  // A half-filled row must not reach the batch as a zero address.
  it('ignores rows that are not addresses', () => {
    renderReview({ tokens: [{ address: USDC }, { address: '' }], recipients: [{ address: RECIPIENT }] })

    const snapshot = captured.snapshotData as { allowlist: Array<{ token: { address: string } }> }
    expect(snapshot.allowlist).toHaveLength(1)
    expect(snapshot.allowlist[0].token.address.toLowerCase()).toBe(USDC.toLowerCase())
  })

  it('gives every token the same recipients, and names them in the snapshot', () => {
    renderReview({ tokens: [{ address: USDC }, { address: DAI }], recipients: [{ address: RECIPIENT }] })

    const snapshot = captured.snapshotData as {
      allowlist: Array<{ token: { symbol: string }; recipients: Array<{ address: string }> }>
    }
    expect(snapshot.allowlist).toHaveLength(2)
    expect(snapshot.allowlist.every((entry) => entry.recipients.length === 1)).toBe(true)
    // Metadata is resolved from the token list so a pending row reads as USDC, not an address.
    expect(snapshot.allowlist[0].token.symbol).toBe('USDC')
  })
})
