import { render, screen, fireEvent } from '@/tests/test-utils'
import { DrawerSignatures, type DrawerSignatureRow } from '../DrawerSignatures'

const rows: DrawerSignatureRow[] = [
  { id: 'created', status: 'created', signer: 'Alice', time: 'Nov 12, 10:02' },
  { id: 'alice', status: 'signed', signer: 'Alice', time: 'Nov 12, 10:04' },
  { id: 'bob', status: 'needed', signer: 'Bob', action: <button>Notify</button> },
]

const visible = (text: string) => screen.getAllByText(text).filter((element) => !element.closest('[hidden]'))

describe('DrawerSignatures', () => {
  it('starts folded with how many signatures are still required', () => {
    render(<DrawerSignatures signed={1} required={2} rows={rows} />)

    expect(screen.getByText('1 of 2 required')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Show signatures' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByRole('button', { name: 'Notify' })).not.toBeInTheDocument()
  })

  it('unfolds into the signer timeline, with the row action on a missing signer', () => {
    render(<DrawerSignatures signed={1} required={2} rows={rows} />)

    fireEvent.click(screen.getByRole('button', { name: 'Show signatures' }))

    expect(screen.getByRole('button', { name: 'Hide signatures' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/Created by/)).toBeInTheDocument()
    expect(screen.getByText('Signed')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Notify' })).toBeInTheDocument()
  })

  it('draws a solid line before a signature and a dashed one before a missing signer', () => {
    render(<DrawerSignatures signed={1} required={2} rows={rows} defaultOpen />)

    const items = screen.getAllByRole('listitem')

    expect(items[0].querySelector('[aria-hidden].border-l')).not.toHaveClass('border-dashed')
    expect(items[1].querySelector('[aria-hidden].border-l')).toHaveClass('border-dashed')
    expect(items[2].querySelector('[aria-hidden].border-l')).toBeNull()
  })

  it('says when every signature is in', () => {
    render(<DrawerSignatures signed={2} required={2} rows={rows.slice(0, 2)} />)

    expect(screen.getByText('2 of 2 signed')).toBeInTheDocument()
  })

  it('asks for your signature once, in the badge while folded and on your row when open', () => {
    const yourTurn: DrawerSignatureRow[] = [
      ...rows.slice(0, 2),
      { id: 'you', status: 'needed', signer: 'Carol', you: true },
    ]
    render(<DrawerSignatures signed={1} required={2} rows={yourTurn} />)

    expect(visible('Your signature required')).toHaveLength(1)

    fireEvent.click(screen.getByRole('button', { name: 'Show signatures' }))

    expect(visible('Your signature required')).toHaveLength(1)
    expect(screen.getByText('(you)')).toBeInTheDocument()
  })
})
