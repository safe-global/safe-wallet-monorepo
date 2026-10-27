import { render } from '@/tests/test-utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import { NO_MULTISEND_ERROR } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import * as contractsHook from '../../../GuardPolicyFlow/hooks/useGuardPolicyContracts'
import { SAFE_ADDRESS } from '../../../GuardPolicyFlow/guardPolicyStep.fixtures'
import ReviewMultiSendPolicy from '../index'

const GUARD = '0x2222222222222222222222222222222222222222'
const POLICY = '0x3333333333333333333333333333333333333333'

jest.mock('@/hooks/useSafeInfo')
const mockedUseSafeInfo = jest.mocked(useSafeInfo)

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

const renderReview = (chainId: string, version: string | null = '1.4.1') => {
  mockedUseSafeInfo.mockReturnValue({
    safe: extendedSafeInfoBuilder().with({ version }).build(),
  } as never)

  jest.spyOn(contractsHook, 'useGuardPolicyContracts').mockReturnValue({
    chainId,
    safeAddress: SAFE_ADDRESS as `0x${string}`,
    safePolicyGuard: GUARD as `0x${string}`,
    policyContract: POLICY as `0x${string}`,
    fallbackPolicy: '0x92e94Af03982C2486dffa8DcBc5d069D33996eF2',
    multiSendDefaults: undefined,
    currentGuard: undefined,
    currentModuleGuard: undefined,
    isGuardSet: false,
    isUnknownGuard: false,
    isUnsupportedVersion: false,
    isLoading: false,
  })

  return render(<ReviewMultiSendPolicy onSubmit={jest.fn()} />)
}

describe('ReviewMultiSendPolicy', () => {
  beforeEach(() => {
    captured = {}
  })
  afterEach(() => jest.restoreAllMocks())

  it('builds the batch against the chain MultiSend deployment', () => {
    renderReview('11155111')

    expect(captured.build).toHaveProperty('batch')
  })

  // A batch bound to no MultiSend would be silently unenforced, so the review refuses instead.
  it('refuses when the chain has no MultiSend deployment', () => {
    renderReview('99999999')

    const build = captured.build as { error?: Error }
    expect(build.error?.message).toBe(NO_MULTISEND_ERROR)
  })
})
