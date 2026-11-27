import { faker } from '@faker-js/faker'

import { render } from '@/tests/test-utils'
import { dateString } from '@safe-global/utils/utils/formatters'
import RecoveryDetails from '.'
import type { RecoveryQueueItem } from '../../services/recovery-state'

jest.mock('../RecoverySigners', () => ({
  __esModule: true,
  default: () => null,
}))

jest.mock('../RecoveryDescription', () => ({
  __esModule: true,
  default: () => null,
}))

const MS_PER_SECOND = BigInt(1000)
const DAY_IN_SECONDS = BigInt(24 * 60 * 60)
// Delay Modifier on sep:0x2a73e61bd15b25B6958b4DA3bfc759ca4db249b9 (WA-3903)
const CREATED_AT_SECONDS = BigInt(1_792_079_184)
const COOLDOWN_SECONDS = BigInt(86_400_000_000_000)

const buildItem = (delaySeconds: bigint, expirySeconds: bigint | null): RecoveryQueueItem => {
  const validFromSeconds = CREATED_AT_SECONDS + delaySeconds

  return {
    address: faker.finance.ethereumAddress(),
    transactionHash: faker.string.hexadecimal({ length: 64 }),
    timestamp: CREATED_AT_SECONDS * MS_PER_SECOND,
    validFrom: validFromSeconds * MS_PER_SECOND,
    expiresAt: expirySeconds === null ? null : (validFromSeconds + expirySeconds) * MS_PER_SECOND,
    args: {
      to: faker.finance.ethereumAddress(),
      value: BigInt(0),
      data: '0x',
      operation: BigInt(0),
      queueNonce: BigInt(0),
    },
  } as unknown as RecoveryQueueItem
}

describe('RecoveryDetails', () => {
  it('shows the created, executable and expiry dates', () => {
    const item = buildItem(DAY_IN_SECONDS * BigInt(28), DAY_IN_SECONDS * BigInt(7))

    const { getByText } = render(<RecoveryDetails item={item} />)

    expect(getByText(dateString(Number(item.timestamp)))).toBeInTheDocument()
    expect(getByText(dateString(Number(item.validFrom)))).toBeInTheDocument()
    expect(getByText(dateString(Number(item.expiresAt)))).toBeInTheDocument()
  })

  it('renders a cooldown past the latest JS date as an offset from creation', () => {
    const item = buildItem(COOLDOWN_SECONDS, null)

    const { getByText, queryByText } = render(<RecoveryDetails item={item} />)

    expect(getByText(dateString(Number(item.timestamp)))).toBeInTheDocument()
    expect(getByText('1000000000 days after creation')).toBeInTheDocument()
    expect(queryByText('Expires')).not.toBeInTheDocument()
  })

  it('renders an expiry past the latest JS date as an offset from creation', () => {
    const item = buildItem(DAY_IN_SECONDS, COOLDOWN_SECONDS)

    const { getByText } = render(<RecoveryDetails item={item} />)

    expect(getByText(dateString(Number(item.validFrom)))).toBeInTheDocument()
    expect(getByText('1000000001 days after creation')).toBeInTheDocument()
  })
})
