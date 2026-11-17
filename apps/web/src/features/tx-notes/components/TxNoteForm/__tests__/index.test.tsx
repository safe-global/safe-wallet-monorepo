import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import TxNoteForm from '..'

describe('TxNoteForm', () => {
  it('shows the note input when creating a transaction', () => {
    render(<TxNoteForm isCreation onChange={jest.fn()} />)

    expect(screen.getByRole('textbox', { name: 'Note' })).toBeInTheDocument()
  })

  it('shows the note of an existing transaction as read-only text', () => {
    const note = faker.lorem.sentence()
    const txDetails = transactionDetailsBuilder().with({ note }).build()

    render(<TxNoteForm isCreation={false} txDetails={txDetails} onChange={jest.fn()} />)

    expect(screen.getByTestId('tx-note')).toHaveTextContent(note)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('renders nothing for an existing transaction without a note', () => {
    const txDetails = transactionDetailsBuilder().with({ note: null }).build()

    const { container } = render(<TxNoteForm isCreation={false} txDetails={txDetails} onChange={jest.fn()} />)

    expect(container).toBeEmptyDOMElement()
  })
})
