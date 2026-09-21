import { render, screen } from '@/tests/test-utils'
import AccountIdentity from '../AccountIdentity'

const ADDRESS = '0x8675B754342754A30A2AeF474D114d8460bca19b'

describe('AccountIdentity', () => {
  it('shows the name above the shortened address', () => {
    render(<AccountIdentity address={ADDRESS} name="Ops" />)

    expect(screen.getByText('Ops')).toBeInTheDocument()
    expect(screen.getByText('0x8675...a19b')).toBeInTheDocument()
  })

  it('falls back to the address when the account has no name', () => {
    render(<AccountIdentity address={ADDRESS} />)

    expect(screen.queryByText('Ops')).not.toBeInTheDocument()
    expect(screen.getAllByText('0x8675...a19b').length).toBeGreaterThan(0)
  })
})
