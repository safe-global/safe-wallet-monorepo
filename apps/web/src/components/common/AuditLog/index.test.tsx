import { render, screen } from '@/tests/test-utils'
import { AuditRow } from './index'

const ADDRESS = '0xcE4304Cd1A1Fa2A3e4e40f0C1dCc0F4C4F8bb254'

describe('AuditRow', () => {
  it('names the copy control by the address it copies', () => {
    render(<AuditRow label="Signed (1/3)" actionType="signed" address={ADDRESS} />)

    const copy = screen.getByRole('button', { name: `Copy address ${ADDRESS}` })
    // The visible text stays short; only the accessible name carries the rest.
    expect(copy).toHaveTextContent('By 0xcE43...b254')
  })
})
