import { userEvent } from '@testing-library/user-event'
import { render, screen, fireEvent } from '@/tests/test-utils'
import { DrawerSignatures, DrawerSignaturesBadge, type DrawerSignatureRow } from '../DrawerSignatures'

const rows: DrawerSignatureRow[] = [
  { id: 'created', status: 'created', signer: 'Alice', time: 'Nov 12, 10:02' },
  { id: 'alice', status: 'signed', signer: 'Alice', time: 'Nov 12, 10:04' },
  { id: 'bob', status: 'needed', signer: 'Bob', action: <button>Notify</button> },
]

const required = <DrawerSignaturesBadge tone="warning">1 of 2 required</DrawerSignaturesBadge>

describe('DrawerSignatures', () => {
  it('starts folded with how many signatures are still required', () => {
    render(<DrawerSignatures status={required} rows={rows} />)

    expect(screen.getByText('1 of 2 required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show signatures' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Notify' })).not.toBeInTheDocument()
  })

  it('unfolds into the signer timeline, with the row action on a missing signer', () => {
    render(<DrawerSignatures status={required} rows={rows} />)

    fireEvent.click(screen.getByRole('button', { name: 'Show signatures' }))

    expect(screen.getByRole('button', { name: 'Hide signatures' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Created by/)).toBeInTheDocument()
    expect(screen.getByText('Signed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notify' })).toBeInTheDocument()
  })

  it('draws a solid line before a signature and a dashed one before a missing signer', () => {
    render(<DrawerSignatures status={required} rows={rows} defaultOpen />)

    const items = screen.getAllByRole('listitem')

    expect(items[0].querySelector('[aria-hidden].border-l')).not.toHaveClass('border-dashed')
    expect(items[1].querySelector('[aria-hidden].border-l')).toHaveClass('border-dashed')
    expect(items[2].querySelector('[aria-hidden].border-l')).toBeNull()
  })

  it('keeps the status the app passes, folded and open', () => {
    render(
      <DrawerSignatures
        status={<DrawerSignaturesBadge tone="success">2 of 2 signed</DrawerSignaturesBadge>}
        rows={rows}
      />,
    )

    expect(screen.getByText('2 of 2 signed')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Show signatures' }))

    expect(screen.getByText('2 of 2 signed')).toBeInTheDocument()
  })

  it('asks for your signature on your row when it is still needed', () => {
    render(
      <DrawerSignatures
        status={required}
        rows={[...rows.slice(0, 2), { id: 'you', status: 'needed', signer: 'Carol', you: true }]}
        defaultOpen
      />,
    )

    expect(screen.getByText('Your signature required')).toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })

  it('shows a signer who is no longer needed without a request, a badge or their action', () => {
    render(
      <DrawerSignatures
        status={<DrawerSignaturesBadge tone="success">2 of 2 signed</DrawerSignaturesBadge>}
        rows={[
          ...rows.slice(0, 2),
          { id: 'bob', status: 'signed', signer: 'Bob' },
          { id: 'you', status: 'not-needed', signer: 'Carol', you: true, action: <button>Notify</button> },
        ]}
        defaultOpen
      />,
    )

    expect(screen.queryByText('Your signature required')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Notify' })).not.toBeInTheDocument()
    expect(screen.getByText('(you)')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')[2].querySelector('[aria-hidden].border-l')).toHaveClass('border-dashed')
  })

  it('shows when each signer signed', async () => {
    render(<DrawerSignatures status={required} rows={rows} defaultOpen />)

    expect(screen.getByText('Nov 12, 10:02')).toBeInTheDocument()

    await userEvent.hover(screen.getByText('Signed'))

    expect(await screen.findByText('Signed on Nov 12, 10:04')).toBeInTheDocument()
  })

  it('tells screen readers a signer is no longer needed', () => {
    render(
      <DrawerSignatures
        status={required}
        rows={[...rows.slice(0, 2), { id: 'carol', status: 'not-needed', signer: 'Carol' }]}
        defaultOpen
      />,
    )

    expect(screen.getAllByRole('listitem')[2]).toHaveTextContent('CarolNot needed')
  })
})
