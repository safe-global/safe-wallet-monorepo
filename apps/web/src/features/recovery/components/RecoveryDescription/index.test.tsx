import { faker } from '@faker-js/faker'

import { render, screen } from '@/tests/test-utils'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getRecoveredSafeInfo } from '../../services/transaction-list'
import RecoveryDescription from '.'
import type { RecoveryQueueItem } from '../../services/recovery-state'

jest.mock('@/hooks/useSafeInfo')
jest.mock('../../services/transaction-list')
jest.mock('../../hooks/useIsRecoverer', () => ({ useIsRecoverer: () => false }))

const mockUseSafeInfo = useSafeInfo as jest.MockedFunction<typeof useSafeInfo>
const mockGetRecoveredSafeInfo = getRecoveredSafeInfo as jest.MockedFunction<typeof getRecoveredSafeInfo>

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

  it('renders the recovered owners and threshold', () => {
    mockGetRecoveredSafeInfo.mockReturnValue({
      threshold: 1,
      owners: [{ value: ownerAddress }],
    } as unknown as ReturnType<typeof getRecoveredSafeInfo>)

    render(<RecoveryDescription item={item} />)

    expect(screen.getByText('1 out of 1 owner(s)')).toBeInTheDocument()
  })

  it('warns that the proposal will fail when the recovered setup cannot be derived', () => {
    mockGetRecoveredSafeInfo.mockReturnValue(undefined)

    render(<RecoveryDescription item={item} />)

    expect(screen.getByText(/This recovery proposal will fail/)).toBeInTheDocument()
  })

  it('does not re-derive the setup when a safe-info refresh rebuilds the owners array', () => {
    mockGetRecoveredSafeInfo.mockReturnValue(undefined)

    const { rerender } = render(<RecoveryDescription item={item} />)

    mockSafeInfo()
    rerender(<RecoveryDescription item={item} />)
    mockSafeInfo()
    rerender(<RecoveryDescription item={item} />)

    expect(mockGetRecoveredSafeInfo).toHaveBeenCalledTimes(1)
  })
})
