import { faker } from '@faker-js/faker'

import { render } from '@/tests/test-utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { Errors, logError } from '@/services/exceptions'
import { getRecoveredSafeInfo } from '../../services/transaction-list'
import RecoveryDescription from '.'
import type { RecoveryQueueItem } from '../../services/recovery-state'

jest.mock('@/hooks/useSafeInfo')
jest.mock('../../services/transaction-list')
jest.mock('../../hooks/useIsRecoverer', () => ({ useIsRecoverer: () => false }))

jest.mock('@/services/exceptions', () => ({
  ...jest.requireActual('@/services/exceptions'),
  logError: jest.fn(),
}))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockGetRecoveredSafeInfo = getRecoveredSafeInfo as jest.MockedFunction<typeof getRecoveredSafeInfo>
const mockedLogError = logError as jest.MockedFunction<typeof logError>

const ownerAddress = faker.finance.ethereumAddress()

// A new `owners` array on every call, as a safe-info refresh produces.
const mockSafeInfo = () =>
  mockUseSafeInfo.mockReturnValue({
    safe: { threshold: 1, owners: [{ value: ownerAddress }] },
  } as unknown as ReturnType<typeof useSafeInfo>)

const item = {
  args: { to: faker.finance.ethereumAddress(), value: BigInt(0), data: '0x' },
  isMalicious: false,
} as unknown as RecoveryQueueItem

describe('RecoveryDescription', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSafeInfo()
  })

  it('reports a proposal whose recovered setup cannot be derived', () => {
    mockGetRecoveredSafeInfo.mockImplementation(() => {
      throw new Error('Owner structure has since been modified')
    })

    render(<RecoveryDescription item={item} />)

    expect(mockedLogError).toHaveBeenCalledTimes(1)
    expect(mockedLogError).toHaveBeenCalledWith(Errors._811, expect.any(Error), undefined)
  })

  it('reports it once when a safe-info refresh rebuilds the owners array', () => {
    // The regression: the memo depends on `safe.owners`, which is a new array on
    // every refresh, so it re-evaluated — and re-threw — for reasons unrelated to
    // the proposal, once per proposal rendered in the queue.
    mockGetRecoveredSafeInfo.mockImplementation(() => {
      throw new Error('Owner structure has since been modified')
    })

    const { rerender } = render(<RecoveryDescription item={item} />)

    mockSafeInfo()
    rerender(<RecoveryDescription item={item} />)
    mockSafeInfo()
    rerender(<RecoveryDescription item={item} />)

    expect(mockGetRecoveredSafeInfo.mock.calls.length).toBeGreaterThan(1)
    expect(mockedLogError).toHaveBeenCalledTimes(1)
  })

  it('reports nothing when the recovered setup derives cleanly', () => {
    mockGetRecoveredSafeInfo.mockReturnValue({
      threshold: 1,
      owners: [{ value: ownerAddress }],
    } as unknown as ReturnType<typeof getRecoveredSafeInfo>)

    render(<RecoveryDescription item={item} />)

    expect(mockedLogError).not.toHaveBeenCalled()
  })
})
