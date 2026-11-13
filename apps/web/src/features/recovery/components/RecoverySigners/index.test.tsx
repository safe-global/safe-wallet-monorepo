import { render } from '@/tests/test-utils'
import { formatAuditDateTime } from '@/components/common/AuditLog'
import RecoverySigners from '.'
import { useClock } from '../../hooks/useClock'
import { NOW, seedRecoveryScenario, type RecoveryScenarioName } from '../../test-helpers'

jest.mock('../../hooks/useClock')

jest.mock('../ExecuteRecoveryButton', () => ({
  __esModule: true,
  default: () => <button>Execute</button>,
}))

jest.mock('../CancelRecoveryButton', () => ({
  __esModule: true,
  default: () => <button>Cancel</button>,
}))

const EXPIRED_TEXT = 'The recovery proposal has expired and needs to be cancelled before a new one can be created.'
const WAITING_TEXT = 'The recovery proposal can be executed after the review window has passed.'
const EXECUTABLE_NOW_TEXT = 'The recovery proposal can be executed now.'

describe('RecoverySigners', () => {
  beforeEach(() => {
    jest.mocked(useClock).mockReturnValue(NOW)
  })

  it.each<[RecoveryScenarioName, string, string]>([
    ['executableWithoutExpiry', 'Executable', EXECUTABLE_NOW_TEXT],
    ['expired', 'Expired', EXPIRED_TEXT],
    ['waiting', 'Waiting', WAITING_TEXT],
    ['notNext', 'Waiting', WAITING_TEXT],
  ])('labels a %s proposal "%s" and explains it', (scenario, label, text) => {
    const item = seedRecoveryScenario(scenario)

    const { getByText } = render(<RecoverySigners item={item} />)

    expect(getByText(label)).toBeInTheDocument()
    expect(getByText(text)).toBeInTheDocument()
  })

  it('tells until when an executable proposal can be executed', () => {
    const item = seedRecoveryScenario('executable')

    const { getByText } = render(<RecoverySigners item={item} />)

    const expiresAt = formatAuditDateTime(Number(item.expiresAt))
    expect(getByText('Executable')).toBeInTheDocument()
    expect(getByText(`The recovery proposal can be executed until ${expiresAt}.`)).toBeInTheDocument()
  })

  it('renders an expiry past the latest JS date as an offset from creation', () => {
    const item = seedRecoveryScenario('executableBeyondMaxDate')

    const { getByText } = render(<RecoverySigners item={item} />)

    expect(getByText('The recovery proposal can be executed until 1000000000 days after creation.')).toBeInTheDocument()
  })

  it.each<[RecoveryScenarioName, boolean]>([
    ['waiting', true],
    ['notNextWaiting', false],
    ['executable', false],
    ['expired', false],
  ])('for a %s proposal shows the countdown: %s', (scenario, showsCountdown) => {
    const item = seedRecoveryScenario(scenario)

    const { queryByText } = render(<RecoverySigners item={item} />)

    expect(Boolean(queryByText('day'))).toBe(showsCountdown)
  })
})
