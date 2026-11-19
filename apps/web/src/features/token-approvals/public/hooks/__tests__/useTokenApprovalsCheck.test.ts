import { faker } from '@faker-js/faker'
import { MaxUint256 } from 'ethers'
import { renderHook, waitFor } from '@/tests/test-utils'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { readTokenApprovals, type TokenApproval } from '@safe-global/utils/features/token-approvals/allowances'
import { chainBuilder } from '@/tests/builders/chains'
import * as useChains from '@/hooks/useChains'
import { scanApprovalHistory } from '../../../services/approvalHistoryScan'
import useTokenApprovalsCheck from '../useTokenApprovalsCheck'

jest.mock('../../../services/approvalHistoryScan')
jest.mock('@safe-global/utils/features/token-approvals/allowances')

const SAFE = faker.finance.ethereumAddress()

const buildApproval = (isUnlimited: boolean): TokenApproval => ({
  key: faker.string.uuid(),
  token: { value: faker.finance.ethereumAddress(), symbol: 'USDC', decimals: 6 },
  spender: { value: faker.finance.ethereumAddress() },
  allowance: isUnlimited ? MaxUint256 : 5n,
  isUnlimited,
  lastApproval: { txHash: null, timestamp: faker.date.past().getTime() },
})

const mockChain = (features: FEATURES[]) =>
  jest.spyOn(useChains, 'useChain').mockReturnValue(chainBuilder().with({ chainId: '1', features }).build())

describe('useTokenApprovalsCheck', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('returns undefined and never scans when the Safe’s chain has token approvals off', async () => {
    mockChain([])

    const { result } = renderHook(() => useTokenApprovalsCheck('1', SAFE))

    expect(result.current).toBeUndefined()
    expect(scanApprovalHistory).not.toHaveBeenCalled()
  })

  it('counts the unlimited approvals and lists every approval', async () => {
    mockChain([FEATURES.TOKEN_APPROVALS])
    jest.mocked(scanApprovalHistory).mockResolvedValue([])
    jest.mocked(readTokenApprovals).mockResolvedValue([buildApproval(true), buildApproval(false)])

    const { result } = renderHook(() => useTokenApprovalsCheck('1', SAFE))

    await waitFor(() => expect(result.current).toMatchObject({ status: 'ready', unlimitedCount: 1 }))
    expect(result.current?.status === 'ready' && result.current.approvals).toHaveLength(2)
  })
})
