import { faker } from '@faker-js/faker'
import { act, render, screen } from '@/tests/test-utils'
import { HIDDEN_NOTE, usePrivateNotesPrototype } from '../services/privateNotesPrototype'
import PrivateNotesAppProvider from './PrivateNotesAppProvider'

const mockQuery: Record<string, string> = {}
jest.mock('@/services/local-storage/useLocalStorage', () => ({
  __esModule: true,
  default: () => jest.requireActual('react').useState(),
}))
jest.mock('next/router', () => ({
  ...jest.requireActual('next/router'),
  useRouter: () => ({ query: mockQuery }),
}))

const TX_ID = `multisig_${faker.finance.ethereumAddress()}_${faker.string.hexadecimal({ length: 64 })}`

let prototype: ReturnType<typeof usePrivateNotesPrototype>

const Reader = () => {
  prototype = usePrivateNotesPrototype()
  const note = prototype.notes[TX_ID]
  return (
    <>
      <span data-testid="access">{prototype.access}</span>
      <span data-testid="outside">{prototype.outsideSigners}</span>
      <span data-testid="note">{note === HIDDEN_NOTE ? 'hidden' : (note?.text ?? 'none')}</span>
    </>
  )
}

const renderProvider = () =>
  render(
    <PrivateNotesAppProvider>
      <Reader />
    </PrivateNotesAppProvider>,
  )

describe('PrivateNotesAppProvider', () => {
  beforeEach(() => {
    Object.keys(mockQuery).forEach((key) => delete mockQuery[key])
  })

  it('attaches the note written on the Review step to the transaction once it has an id', () => {
    const text = faker.lorem.sentence()
    renderProvider()

    act(() => {
      prototype.setDraft(text)
      prototype.commitDraft(TX_ID)
    })

    expect(screen.getByTestId('note')).toHaveTextContent(text)
  })

  it('saves nothing when the field was left empty', () => {
    renderProvider()

    act(() => {
      prototype.setDraft('   ')
      prototype.commitDraft(TX_ID)
    })

    expect(screen.getByTestId('note')).toHaveTextContent('none')
  })

  it('does not attach one note to two transactions', () => {
    renderProvider()

    act(() => {
      prototype.setDraft(faker.lorem.sentence())
      prototype.commitDraft(faker.string.uuid())
      prototype.commitDraft(TX_ID)
    })

    expect(screen.getByTestId('note')).toHaveTextContent('none')
  })

  it('takes the note field state and the outside signers from the URL', () => {
    mockQuery.noteAccess = 'signedOut'
    mockQuery.noteOutsideSigners = '2'

    renderProvider()

    expect(screen.getByTestId('access')).toHaveTextContent('signedOut')
    expect(screen.getByTestId('outside')).toHaveTextContent('2')
  })

  it('ignores a state the URL does not spell right', () => {
    mockQuery.noteAccess = 'locked'

    renderProvider()

    expect(screen.getByTestId('access')).toHaveTextContent('ready')
  })

  it('keeps a saved note but hides its text when the plan has no private notes', () => {
    mockQuery.noteAccess = 'lockedPlan'
    renderProvider()

    act(() => {
      prototype.setDraft(faker.lorem.sentence())
      prototype.commitDraft(TX_ID)
    })

    expect(screen.getByTestId('note')).toHaveTextContent('hidden')
  })
})
