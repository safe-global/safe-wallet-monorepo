import { render, screen } from '@/tests/test-utils'
import { TxFlowContext } from '@/components/tx-flow/TxFlowProvider'
import {
  ALLOWED_LABEL,
  FALLS_BACK_LABEL,
  NOTHING_LABEL,
} from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import * as contractsHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import { CHAIN_ID, SAFE_ADDRESS } from '../../../GuardPolicyFlow/guardPolicyStep.fixtures'
import { SAFE_MANAGEMENT_FUNCTIONS, SAFE_MANAGEMENT_FUNCTION_IDS } from '../../contracts'
import ReviewSafeManagementPolicy from '../index'

const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'

let captured: Record<string, unknown> = {}
jest.mock('../../../GuardPolicyFlow/GuardPolicyReview', () => ({
  __esModule: true,
  default: (props: Record<string, unknown>) => {
    captured = props
    return <div data-testid="guard-policy-review">{props.summary as React.ReactNode}</div>
  },
}))

jest.mock('@safe-global/views/components/tx-flow/safe-scope', () => ({
  ...jest.requireActual('@safe-global/views/components/tx-flow/safe-scope'),
  useSafeScope: () => ({ chainId: '11155111', safeAddress: '0x1111111111111111111111111111111111111111' }),
}))

const renderReview = (functionIds: string[]) => {
  jest.spyOn(contractsHook, 'useGuardPolicyContracts').mockReturnValue({
    chainId: CHAIN_ID,
    safeAddress: SAFE_ADDRESS as `0x${string}`,
    safePolicyGuard: GUARD as `0x${string}`,
    policyContract: POLICY as `0x${string}`,
    fallbackPolicy: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
    currentGuard: undefined,
    currentModuleGuard: undefined,
    isGuardSet: false,
    isUnknownGuard: false,
    isUnsupportedVersion: false,
    isLoading: false,
  })

  return render(
    <TxFlowContext.Provider
      value={{ data: { safe: `${CHAIN_ID}:${SAFE_ADDRESS}`, functionIds, guardLockConfirmed: true } } as never}
    >
      <ReviewSafeManagementPolicy onSubmit={jest.fn()} />
    </TxFlowContext.Provider>,
  )
}

describe('ReviewSafeManagementPolicy', () => {
  beforeEach(() => {
    captured = {}
  })
  afterEach(() => jest.restoreAllMocks())

  it('builds the batch as an Allow policy, one access per selected change', () => {
    renderReview(SAFE_MANAGEMENT_FUNCTION_IDS)

    const build = captured.build as { batch?: { configurations: { policy: string }[] } }
    const rules = build.batch?.configurations.filter((c) => c.policy === POLICY)
    expect(rules).toHaveLength(SAFE_MANAGEMENT_FUNCTIONS.length)
  })

  // What is left out is the actual restriction, so the review has to name both sides.
  it('splits the changes into what stays allowed and what falls back', () => {
    const [first, ...rest] = SAFE_MANAGEMENT_FUNCTIONS
    renderReview(rest.map((fn) => fn.id))

    expect(screen.getByTestId('safe-management-summary-allowed')).toHaveTextContent(rest[0].label)
    expect(screen.getByTestId('safe-management-summary-fallback')).toHaveTextContent(first.label)
  })

  it('says nothing falls back when every change stays allowed', () => {
    renderReview(SAFE_MANAGEMENT_FUNCTION_IDS)

    expect(screen.getByTestId('safe-management-summary-fallback')).toHaveTextContent(NOTHING_LABEL)
  })

  it('labels both summary cards', () => {
    renderReview(SAFE_MANAGEMENT_FUNCTION_IDS)

    expect(screen.getByText(ALLOWED_LABEL)).toBeInTheDocument()
    expect(screen.getByText(FALLS_BACK_LABEL)).toBeInTheDocument()
  })
})
