import { faker } from '@faker-js/faker'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { readTokenApprovals, type TokenApproval } from '@safe-global/utils/features/token-approvals/allowances'
import { chainBuilder } from '@/tests/builders/chains'
import { logError } from '@/services/exceptions'
import { scanApprovalHistory, type ScanOptions } from '../../services/approvalHistoryScan'
import useTokenApprovals from '../useTokenApprovals'

jest.mock('../../services/approvalHistoryScan')
jest.mock('@safe-global/utils/features/token-approvals/allowances')
jest.mock('@/services/exceptions', () => ({ ...jest.requireActual('@/services/exceptions'), logError: jest.fn() }))

const SAFE = faker.finance.ethereumAddress()
const chain = chainBuilder().with({ chainId: '1' }).build()

const buildApproval = (): TokenApproval => ({
  key: faker.string.uuid(),
  token: { value: faker.finance.ethereumAddress(), symbol: 'DAI', decimals: 18 },
  spender: { value: faker.finance.ethereumAddress() },
  allowance: 1n,
  isUnlimited: false,
  lastApproval: { txHash: null, timestamp: faker.date.past().getTime() },
})

describe('useTokenApprovals', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('reports scanning progress, then the live approvals', async () => {
    const approval = buildApproval()
    let reportProgress: ScanOptions['onProgress']
    let finishScan: () => void = () => {}
    jest.mocked(scanApprovalHistory).mockImplementation((options) => {
      reportProgress = options.onProgress
      return new Promise((resolve) => (finishScan = () => resolve([])))
    })
    jest.mocked(readTokenApprovals).mockResolvedValue([approval])
    const { result } = renderHook(() => useTokenApprovals(chain, SAFE, true, 10))
    await waitFor(() => expect(reportProgress).toBeDefined())

    act(() => reportProgress!({ scannedCount: 40 }))
    expect(result.current.state).toEqual({ status: 'scanning', scannedCount: 40 })
    await act(async () => finishScan())

    expect(result.current.state).toMatchObject({ status: 'ready', approvals: [approval] })
    expect(scanApprovalHistory).toHaveBeenCalledWith(expect.objectContaining({ safeAddress: SAFE, batchSize: 10 }))
  })

  it('does not scan while disabled', async () => {
    renderHook(() => useTokenApprovals(chain, SAFE, false))

    await act(async () => {})

    expect(scanApprovalHistory).not.toHaveBeenCalled()
  })

  it('logs and shows an error when the scan fails', async () => {
    const error = new Error('gateway down')
    jest.mocked(scanApprovalHistory).mockRejectedValue(error)

    const { result } = renderHook(() => useTokenApprovals(chain, SAFE, true))

    await waitFor(() => expect(result.current.state).toEqual({ status: 'error' }))
    expect(logError).toHaveBeenCalledWith(expect.stringContaining('657'), error)
  })

  it('never shows the approvals of a Safe the user has moved away from', async () => {
    const otherSafe = faker.finance.ethereumAddress()
    let finishFirstScan: () => void = () => {}
    jest
      .mocked(scanApprovalHistory)
      .mockImplementationOnce(() => new Promise((resolve) => (finishFirstScan = () => resolve([]))))
      .mockResolvedValue([])
    jest.mocked(readTokenApprovals).mockImplementation(async (_, safe) => (safe === SAFE ? [buildApproval()] : []))
    const { result, rerender } = renderHook(({ safe }) => useTokenApprovals(chain, safe, true), {
      initialProps: { safe: SAFE },
    })

    rerender({ safe: otherSafe })
    await act(async () => finishFirstScan())

    await waitFor(() => expect(result.current.state).toMatchObject({ status: 'ready', approvals: [] }))
  })
})
