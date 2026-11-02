import { render, screen } from '@/tests/test-utils'
import { AuditRow, formatAuditDateTime } from './index'

const ADDRESS = '0xcE4304Cd1A1Fa2A3e4e40f0C1dCc0F4C4F8bb254'

describe('AuditRow', () => {
  it('names the copy control by the address it copies', () => {
    render(<AuditRow label="Signed (1/3)" actionType="signed" address={ADDRESS} />)

    const copy = screen.getByRole('button', { name: `Copy address ${ADDRESS}` })
    // The visible text stays short; only the accessible name carries the rest.
    expect(copy).toHaveTextContent('By 0xcE43...b254')
  })
})

describe('formatAuditDateTime', () => {
  it('should, when given a timestamp, return the date and time with seconds in the default locale', () => {
    expect(formatAuditDateTime(new Date(2026, 7, 3, 9, 39, 45).getTime())).toBe('Aug 3, 2026, 09:39:45 AM')
  })
})
