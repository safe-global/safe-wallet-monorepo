import { faker } from '@faker-js/faker'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { fakerChecksummedAddress, render, screen } from '@/tests/test-utils'
import { multisigExecutionDetailsBuilder, transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import { HIDDEN_NOTE, PrivateNotesPrototypeProvider } from '../../../public/services/privateNotesPrototype'
import TxNote from '..'

const noteByProposer = (note: string | null, proposer: string) =>
  transactionDetailsBuilder()
    .with({
      note,
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({ proposer: { value: proposer } })
        .build(),
    })
    .build()

describe('TxNote', () => {
  it('shows a public note as read-only text, labelled public', () => {
    const note = faker.lorem.sentence()

    render(<TxNote txDetails={noteByProposer(note, fakerChecksummedAddress())} />)

    expect(screen.getByTestId('tx-note')).toHaveTextContent(note)
    expect(screen.getByTestId('tx-note-label')).toHaveTextContent('Public note')
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('credits the proposer of a public note', () => {
    const proposer = fakerChecksummedAddress()

    render(<TxNote txDetails={noteByProposer(faker.lorem.sentence(), proposer)} />)

    expect(screen.getByTestId('note-creator')).toHaveTextContent(shortenAddress(proposer))
  })

  it('shows the private note with its author, ahead of a public note', () => {
    const txDetails = noteByProposer(faker.lorem.sentence(), fakerChecksummedAddress())
    const text = faker.lorem.sentence()

    render(
      <PrivateNotesPrototypeProvider
        value={{ notes: { [txDetails.txId]: { text, author: 'Ana Ruiz', createdAt: Date.now() } } }}
      >
        <TxNote txDetails={txDetails} />
      </PrivateNotesPrototypeProvider>,
    )

    expect(screen.getByTestId('tx-note')).toHaveTextContent(text)
    expect(screen.getByTestId('tx-note-label')).toHaveTextContent('Private note')
    expect(screen.getByTestId('note-creator')).toHaveTextContent('Ana Ruiz')
  })

  it('keeps a link in a note as plain text', () => {
    const txDetails = noteByProposer(null, fakerChecksummedAddress())

    render(
      <PrivateNotesPrototypeProvider
        value={{
          notes: { [txDetails.txId]: { text: 'See https://example.com', author: 'Ana Ruiz', createdAt: Date.now() } },
        }}
      >
        <TxNote txDetails={txDetails} />
      </PrivateNotesPrototypeProvider>,
    )

    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('hides the text of a note the plan no longer covers', () => {
    const txDetails = noteByProposer(null, fakerChecksummedAddress())

    render(
      <PrivateNotesPrototypeProvider value={{ notes: { [txDetails.txId]: HIDDEN_NOTE } }}>
        <TxNote txDetails={txDetails} />
      </PrivateNotesPrototypeProvider>,
    )

    expect(screen.queryByTestId('tx-note')).not.toBeInTheDocument()
    expect(screen.getByTestId('tx-note-hidden')).toHaveTextContent('Note hidden. Upgrade to Pro to read.')
  })

  it('renders nothing without a note', () => {
    const { container } = render(<TxNote txDetails={noteByProposer(null, fakerChecksummedAddress())} />)

    expect(container).toBeEmptyDOMElement()
  })
})
