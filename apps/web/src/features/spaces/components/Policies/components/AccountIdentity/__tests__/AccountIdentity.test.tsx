import userEvent from '@testing-library/user-event'
import { render, screen } from '@/tests/test-utils'
import AccountIdentity from '../AccountIdentity'

const ADDRESS = '0x8675B754342754A30A2AeF474D114d8460bca19b'

describe('AccountIdentity', () => {
  it('shows the name above the shortened address', () => {
    render(<AccountIdentity address={ADDRESS} name="Ops" />)

    expect(screen.getByText('Ops')).toBeInTheDocument()
    expect(screen.getByText('0x8675...a19b')).toBeInTheDocument()
  })

  it('shows the address once as the only label when the account has no name', () => {
    render(<AccountIdentity address={ADDRESS} />)

    expect(screen.queryByText('Ops')).not.toBeInTheDocument()
    expect(screen.getAllByText('0x8675...a19b')).toHaveLength(1)
  })

  it('has no copy button unless asked for one', () => {
    render(<AccountIdentity address={ADDRESS} name="Ops" />)

    expect(screen.queryByTestId('copy-btn-icon')).not.toBeInTheDocument()
  })

  it('copies the checksummed address when the copy button is enabled', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(<AccountIdentity address={ADDRESS.toLowerCase()} name="Ops" showCopyButton />)

    await userEvent.click(screen.getByTestId('copy-btn-icon'))

    expect(writeText).toHaveBeenCalledWith(ADDRESS)
  })

  it('reveals the full address on hover', async () => {
    render(<AccountIdentity address={ADDRESS} name="Ops" />)

    expect(screen.queryByText(ADDRESS)).not.toBeInTheDocument()

    await userEvent.hover(screen.getByText('0x8675...a19b'))

    expect(await screen.findByText(ADDRESS)).toBeInTheDocument()
  })

  it('links the name to the given page', () => {
    render(<AccountIdentity address={ADDRESS} name="Ops" href="/settings/setup" />)

    expect(screen.getByRole('link', { name: 'Ops' })).toHaveAttribute('href', '/settings/setup')
  })

  it('links the address when the account has no name', () => {
    render(<AccountIdentity address={ADDRESS} href="/settings/setup" />)

    expect(screen.getByRole('link', { name: '0x8675...a19b' })).toHaveAttribute('href', '/settings/setup')
  })

  it('renders no link without an href', () => {
    render(<AccountIdentity address={ADDRESS} name="Ops" />)

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
