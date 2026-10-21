import { render } from '@/tests/test-utils'
import RecoveryStatus from '.'
import { useClock } from '../../hooks/useClock'
import { NOW, seedRecoveryScenario, type RecoveryScenarioName } from '../../test-helpers'

jest.mock('../../hooks/useClock')

const WARNING_TEXT = 'text-warning-strong'
const ERROR_TEXT = 'text-destructive'

describe('RecoveryStatus', () => {
  beforeEach(() => {
    jest.mocked(useClock).mockReturnValue(NOW)
  })

  it.each<[RecoveryScenarioName, string, string]>([
    ['processing', 'Processing', WARNING_TEXT],
    ['processed', 'Loading', WARNING_TEXT],
    ['executable', 'Awaiting execution', WARNING_TEXT],
    ['executableWithoutExpiry', 'Awaiting execution', WARNING_TEXT],
    ['expired', 'Expired', ERROR_TEXT],
    ['waiting', 'Pending', WARNING_TEXT],
    ['notNext', 'Pending', WARNING_TEXT],
  ])('shows a %s proposal as "%s"', (scenario, label, colour) => {
    const recovery = seedRecoveryScenario(scenario)

    const { getByText } = render(<RecoveryStatus recovery={recovery} />)

    expect(getByText(label)).toHaveClass(colour)
  })
})
