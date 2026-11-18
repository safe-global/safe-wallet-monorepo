import { advanceClock, render, renderOnFakeClock, screen } from '@/tests/test-utils'
import { AuditRow } from './index'

const ADDRESS = '0xcE4304Cd1A1Fa2A3e4e40f0C1dCc0F4C4F8bb254'
const COPIED_FEEDBACK_MS = 750

const renderSignedRow = () => {
  const rendered = renderOnFakeClock(<AuditRow label="Signed (1/3)" actionType="signed" address={ADDRESS} />)
  const writeText = jest.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
  return { ...rendered, writeText }
}

const copyControl = () => screen.getByRole('button', { name: `Copy address ${ADDRESS}` })

describe('AuditRow', () => {
  beforeEach(() => {
    jest.useFakeTimers({ advanceTimers: false })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('names the copy control by the full address but shows the address shortened', () => {
    render(<AuditRow label="Signed (1/3)" actionType="signed" address={ADDRESS} />)

    expect(copyControl()).toHaveTextContent('By 0xcE43...b254')
  })

  it('copies the full address when the actor is clicked', async () => {
    const { user, writeText } = renderSignedRow()

    await user.click(copyControl())

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
  })

  it('shows "Copied" after the address is copied with the keyboard', async () => {
    const { user } = renderSignedRow()

    await user.tab()
    await user.keyboard('{Enter}')

    expect(await screen.findByText('Copied')).toBeInTheDocument()
  })

  it('shows the copy hint again once the copied feedback has expired', async () => {
    const { user } = renderSignedRow()
    await user.tab()
    await user.keyboard('{Enter}')
    await screen.findByText('Copied')

    await advanceClock(COPIED_FEEDBACK_MS)

    expect(screen.getByText('Click to copy address')).toBeInTheDocument()
  })
})
