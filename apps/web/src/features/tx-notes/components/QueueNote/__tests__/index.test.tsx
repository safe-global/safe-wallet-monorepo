import { faker } from '@faker-js/faker'
import { render, screen } from '@/tests/test-utils'
import {
  HIDDEN_NOTE,
  PrivateNotesPrototypeProvider,
  type PrivateNoteEntry,
} from '../../../public/services/privateNotesPrototype'
import QueueNote from '..'

const TX_ID = faker.string.uuid()

const renderNote = (note: PrivateNoteEntry | undefined, props: { href?: string; showText?: boolean } = {}) =>
  render(
    <PrivateNotesPrototypeProvider value={{ notes: note ? { [TX_ID]: note } : {} }}>
      <QueueNote txId={TX_ID} nonce={7} {...props} />
    </PrivateNotesPrototypeProvider>,
  )

const note = () => ({ text: faker.lorem.sentence(), author: faker.person.fullName(), createdAt: Date.now() })

describe('QueueNote', () => {
  it('renders nothing for a transaction without a note', () => {
    const { container } = renderNote(undefined)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows an icon that links to the transaction, without the text', () => {
    const entry = note()
    const href = faker.internet.url()

    renderNote(entry, { href })

    expect(screen.getByRole('link', { name: 'Note for transaction 7' })).toHaveAttribute('href', href)
    expect(screen.queryByText(entry.text)).not.toBeInTheDocument()
  })

  it('shows the text beside the icon on an extra-wide table', () => {
    const entry = note()

    renderNote(entry, { showText: true })

    expect(screen.getByTestId('queue-note')).toHaveTextContent(entry.text)
  })

  it('shows a lock for a hidden note, never its text, and links to the plans', () => {
    renderNote(HIDDEN_NOTE, { showText: true })

    const link = screen.getByRole('link', { name: 'Hidden note for transaction 7. Upgrade to Pro to read.' })
    expect(link).toHaveAttribute('href', '/spaces/plans')
    expect(screen.getByTestId('queue-note')).toHaveTextContent('')
  })
})
