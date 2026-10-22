import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { useMergedAddressBooks } from '@/hooks/useAllAddressBooks'
import {
  createDefaultAllowlistValues,
  type AllowlistRecipient,
  type RecipientAllowlistFormValues,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import RecipientsSection from '../RecipientsSection'

jest.mock('@/hooks/useAllAddressBooks', () => ({
  ContactSource: { space: 'space', local: 'local' },
  useMergedAddressBooks: jest.fn(),
}))
jest.mock('../AddFromAddressBook', () => ({
  __esModule: true,
  default: ({ onAdd }: { onAdd: (recipients: AllowlistRecipient[]) => void }) => (
    <button onClick={() => onAdd([{ address: BOOK_ADDRESS, name: 'Carol', fromAddressBook: true, selected: true }])}>
      Add from address book
    </button>
  ),
}))
let mockDraftName: string | undefined = 'Dave'
jest.mock('../RecipientDraftRow', () => ({
  __esModule: true,
  default: ({ onAdd, onCancel }: { onAdd: (recipient: AllowlistRecipient) => void; onCancel: () => void }) => (
    <div>
      <button onClick={() => onAdd({ address: DRAFT_ADDRESS, name: mockDraftName, selected: true })}>
        confirm draft
      </button>
      <button onClick={onCancel}>cancel draft</button>
    </div>
  ),
}))

const mockBooks = useMergedAddressBooks as jest.MockedFunction<typeof useMergedAddressBooks>

const BOOK_ADDRESS = checksumAddress(faker.finance.ethereumAddress())
const DRAFT_ADDRESS = checksumAddress(faker.finance.ethereumAddress())
const SAFE_ADDRESS = checksumAddress(faker.finance.ethereumAddress())
const CHAIN_ID = '1'

const recipient = (overrides: Partial<AllowlistRecipient> = {}): AllowlistRecipient => ({
  address: checksumAddress(faker.finance.ethereumAddress()),
  selected: true,
  ...overrides,
})

const setup = (
  recipients: AllowlistRecipient[] = [],
  props: {
    hasAccount?: boolean
    isCalloutDismissed?: boolean
    known?: string[]
    contactNames?: Record<string, string>
  } = {},
) => {
  mockBooks.mockReturnValue({
    list: [],
    has: (address: string) => (props.known ?? []).includes(address),
    get: (address: string) => {
      const name = props.contactNames?.[address]
      return name ? { name, address } : undefined
    },
  } as unknown as ReturnType<typeof useMergedAddressBooks>)
  const values: RecipientAllowlistFormValues = { ...createDefaultAllowlistValues(), recipients }
  const onChange = jest.fn()
  const onDismissCallout = jest.fn()
  const hasAccount = props.hasAccount ?? true
  const rendered = renderWithUserEvent(
    <RecipientsSection
      values={values}
      onChange={onChange}
      safeAddress={hasAccount ? SAFE_ADDRESS : undefined}
      chainId={hasAccount ? CHAIN_ID : undefined}
      isCalloutDismissed={props.isCalloutDismissed ?? false}
      onDismissCallout={onDismissCallout}
    />,
  )
  return { ...rendered, values, onChange, onDismissCallout }
}

describe('RecipientsSection', () => {
  beforeEach(() => {
    mockDraftName = 'Dave'
  })

  it('shows the placeholder and disables both actions without an account', () => {
    setup([], { hasAccount: false })

    expect(screen.getByText('Recipients will show here.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add a recipient' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add from address book' })).toBeDisabled()
    expect(screen.queryByText('Only transactions to the recipients selected below will be allowed.')).toBeNull()
    expect(screen.queryByText('confirm draft')).not.toBeInTheDocument()
  })

  it('opens the draft row when the account has no recipients, and appends the added one', async () => {
    const { user, onChange, values } = setup([])

    await user.click(screen.getByText('confirm draft'))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      recipients: [{ address: DRAFT_ADDRESS, name: 'Dave', selected: true }],
    })
    expect(screen.queryByText('confirm draft')).not.toBeInTheDocument()
  })

  it('does not open the draft row when recipients exist, until asked', async () => {
    const { user } = setup([recipient({ name: 'Alice' })])

    expect(screen.queryByText('confirm draft')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add a recipient' }))
    expect(screen.getByText('confirm draft')).toBeInTheDocument()
    await user.click(screen.getByText('cancel draft'))
    expect(screen.queryByText('confirm draft')).not.toBeInTheDocument()
  })

  it('hides Add a recipient while the draft row is open', async () => {
    const { user } = setup([recipient({ name: 'Alice' })])

    await user.click(screen.getByRole('button', { name: 'Add a recipient' }))
    expect(screen.queryByRole('button', { name: 'Add a recipient' })).not.toBeInTheDocument()

    await user.click(screen.getByText('cancel draft'))
    expect(screen.getByRole('button', { name: 'Add a recipient' })).toBeInTheDocument()
  })

  it('toggles a recipient between selected and deselected', async () => {
    const alice = recipient({ name: 'Alice' })
    const bob = recipient({ name: 'Bob' })
    const { user, onChange, values } = setup([alice, bob])

    await user.click(screen.getByRole('button', { name: 'Allow Alice' }))

    expect(onChange).toHaveBeenCalledWith({ ...values, recipients: [{ ...alice, selected: false }, bob] })
  })

  it('names unnamed recipients by their shortened address', () => {
    const unnamed = recipient()
    setup([unnamed])

    expect(screen.getByRole('button', { name: `Allow ${shortenAddress(unnamed.address)}` })).toBeInTheDocument()
  })

  it('marks recipients that are in the address book', () => {
    const fromBook = recipient({ name: 'Alice', fromAddressBook: true })
    const known = recipient({ name: 'Bob' })
    const stranger = recipient({ name: 'Carol' })
    setup([fromBook, known, stranger], { known: [known.address] })

    expect(screen.getAllByLabelText('In your address book')).toHaveLength(2)
  })

  it('appends contacts picked from the address book', async () => {
    const alice = recipient({ name: 'Alice' })
    const { user, onChange, values } = setup([alice])

    await user.click(screen.getByRole('button', { name: 'Add from address book' }))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      recipients: [alice, { address: BOOK_ADDRESS, name: 'Carol', fromAddressBook: true, selected: true }],
    })
  })

  it('ignores recipients that are already listed, whatever their case', async () => {
    const listed = recipient({ name: 'Carol', address: BOOK_ADDRESS.toLowerCase() })
    const { user, onChange, values } = setup([listed])

    await user.click(screen.getByRole('button', { name: 'Add from address book' }))

    expect(onChange).toHaveBeenCalledWith({ ...values, recipients: [listed] })
  })

  it('selects a deselected recipient again when it is added again', async () => {
    const listed = recipient({ address: DRAFT_ADDRESS, selected: false })
    const { user, onChange, values } = setup([listed])

    await user.click(screen.getByRole('button', { name: 'Add a recipient' }))
    await user.click(screen.getByRole('button', { name: 'confirm draft' }))

    expect(onChange).toHaveBeenCalledWith({ ...values, recipients: [{ ...listed, name: 'Dave', selected: true }] })
  })

  it('names an unnamed draft after its address book contact', async () => {
    mockDraftName = undefined
    const { user, onChange, values } = setup([], { contactNames: { [DRAFT_ADDRESS]: 'Treasury' } })

    await user.click(screen.getByText('confirm draft'))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      recipients: [{ address: DRAFT_ADDRESS, name: 'Treasury', selected: true }],
    })
  })

  it('keeps the typed name over the address book name', async () => {
    const { user, onChange, values } = setup([], { contactNames: { [DRAFT_ADDRESS]: 'Treasury' } })

    await user.click(screen.getByText('confirm draft'))

    expect(onChange).toHaveBeenCalledWith({
      ...values,
      recipients: [{ address: DRAFT_ADDRESS, name: 'Dave', selected: true }],
    })
  })

  it('shows the callout and dismisses it', async () => {
    const { user, onDismissCallout } = setup([recipient({ name: 'Alice' })])

    expect(screen.getByText('Only transactions to the recipients selected below will be allowed.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismissCallout).toHaveBeenCalled()
  })

  it('hides the callout once dismissed', () => {
    setup([recipient({ name: 'Alice' })], { isCalloutDismissed: true })

    expect(screen.queryByText('Only transactions to the recipients selected below will be allowed.')).toBeNull()
  })
})
