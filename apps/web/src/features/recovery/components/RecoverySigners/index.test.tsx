import { faker } from '@faker-js/faker'

import { render } from '@/tests/test-utils'
import { formatAuditDateTime } from '@/components/common/AuditLog'
import RecoverySigners from '.'
import { useRecoveryTxState } from '../../hooks/useRecoveryTxState'
import type { RecoveryQueueItem } from '../../services/recovery-state'

jest.mock('../../hooks/useRecoveryTxState')

jest.mock('../ExecuteRecoveryButton', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../CancelRecoveryButton', () => ({
  __esModule: true,
  default: () => null,
}))

const mockUseRecoveryTxState = useRecoveryTxState as jest.MockedFunction<typeof useRecoveryTxState>

const MS_PER_SECOND = BigInt(1000)
const CREATED_AT_SECONDS = BigInt(1_792_079_184)

const buildItem = (expiresAtSeconds: bigint): RecoveryQueueItem =>
  ({
    executor: faker.finance.ethereumAddress(),
    timestamp: CREATED_AT_SECONDS * MS_PER_SECOND,
    validFrom: CREATED_AT_SECONDS * MS_PER_SECOND,
    expiresAt: expiresAtSeconds * MS_PER_SECOND,
  }) as RecoveryQueueItem

describe('RecoverySigners', () => {
  beforeEach(() => {
    mockUseRecoveryTxState.mockReturnValue({
      isExecutable: true,
      isExpired: false,
      isNext: true,
      isPending: false,
      remainingSeconds: 0,
    })
  })

  it('shows until when an executable proposal can be executed', () => {
    const item = buildItem(CREATED_AT_SECONDS + BigInt(7 * 24 * 60 * 60))

    const { getByText } = render(<RecoverySigners item={item} />)

    expect(
      getByText(`The recovery proposal can be executed until ${formatAuditDateTime(Number(item.expiresAt))}.`),
    ).toBeInTheDocument()
  })

  it('renders an expiry past the latest JS date as an offset from creation', () => {
    const item = buildItem(CREATED_AT_SECONDS + BigInt(86_400_000_000_000))

    const { getByText } = render(<RecoverySigners item={item} />)

    expect(getByText('The recovery proposal can be executed until 1000000000 days after creation.')).toBeInTheDocument()
  })
})
