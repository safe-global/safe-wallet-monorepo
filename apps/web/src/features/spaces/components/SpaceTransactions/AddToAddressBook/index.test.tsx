import { faker } from '@faker-js/faker'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { fireEvent, render, screen } from '@/tests/test-utils'
import { buildSpaceAddressBookTags } from '@/tests/builders/space'
import AddToAddressBookButton, { AddToAddressBookProvider } from '.'

const mockIsAdmin = jest.fn(() => true)
jest.mock('../../../public/hooks/useSpaceMembers', () => ({ useIsAdmin: () => mockIsAdmin() }))

const settledBook = { tags: [] as unknown[], isLoading: false, isError: false, isUninitialized: false }
const mockAddressBookState = jest.fn(() => settledBook)
jest.mock('../../../public/hooks/useGetSpaceAddressBook', () => ({
  useSpaceAddressBookState: () => mockAddressBookState(),
}))

const mockAddressBookItem = jest.fn<{ name: string } | undefined, [string, string]>(() => undefined)
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useAddressBookItem: (address: string, chainId: string) => mockAddressBookItem(address, chainId),
}))

const mockHasFeature = jest.fn<boolean, [FEATURES]>(() => false)
jest.mock('@/hooks/useChains', () => ({ useHasFeature: (feature: FEATURES) => mockHasFeature(feature) }))

type FormProps = {
  prefill?: { address: string; chainIds: string[] }
  workspaceTags?: unknown[]
  onClose?: () => void
}
const mockFormProps = jest.fn<void, [FormProps]>()
jest.mock('../../SpaceAddressBook/AddContact', () => ({
  __esModule: true,
  default: (props: FormProps) => {
    mockFormProps(props)
    return (
      <div role="dialog" aria-label="Add contact">
        <button onClick={props.onClose}>Close form</button>
      </div>
    )
  },
}))

const ADDRESS = checksumAddress(faker.finance.ethereumAddress())
const CHAIN_ID = '137'

const renderAction = () =>
  render(
    <AddToAddressBookProvider>
      <AddToAddressBookButton address={ADDRESS} chainId={CHAIN_ID} />
    </AddToAddressBookProvider>,
  )

const action = () => screen.queryByRole('button', { name: 'Add to address book' })

describe('AddToAddressBookButton', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsAdmin.mockReturnValue(true)
    mockAddressBookState.mockReturnValue(settledBook)
    mockAddressBookItem.mockReturnValue(undefined)
    mockHasFeature.mockReturnValue(false)
  })

  it('opens the add-contact form with the address and its network prefilled', () => {
    renderAction()

    fireEvent.click(action()!)

    expect(screen.getByRole('dialog', { name: 'Add contact' })).toBeInTheDocument()
    expect(mockFormProps).toHaveBeenLastCalledWith(
      expect.objectContaining({ prefill: { address: ADDRESS, chainIds: [CHAIN_ID] } }),
    )
  })

  it('keeps the form closed until the action is clicked', () => {
    renderAction()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('removes the form when it closes', () => {
    renderAction()
    fireEvent.click(action()!)

    fireEvent.click(screen.getByRole('button', { name: 'Close form' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('is hidden for an address the address book names on that network', () => {
    mockAddressBookItem.mockImplementation((address, chainId) =>
      address === ADDRESS && chainId === CHAIN_ID ? { name: faker.person.firstName() } : undefined,
    )

    renderAction()

    expect(action()).not.toBeInTheDocument()
  })

  it('is hidden for a member who is not an admin', () => {
    mockIsAdmin.mockReturnValue(false)

    renderAction()

    expect(action()).not.toBeInTheDocument()
  })

  it.each([
    ['is loading', { isLoading: true }],
    ['failed to load', { isError: true }],
    ['was not requested', { isUninitialized: true }],
  ])('is hidden while the address book %s', (_, state) => {
    mockAddressBookState.mockReturnValue({ ...settledBook, ...state })

    renderAction()

    expect(action()).not.toBeInTheDocument()
  })

  it('hands the Workspace tags to the form when the v2 address book is on', () => {
    const tags = buildSpaceAddressBookTags(2)
    mockAddressBookState.mockReturnValue({ ...settledBook, tags })
    mockHasFeature.mockImplementation((feature) => feature === FEATURES.WORKSPACES_ADDRESS_BOOK_V2)
    renderAction()

    fireEvent.click(action()!)

    expect(mockFormProps).toHaveBeenLastCalledWith(expect.objectContaining({ workspaceTags: tags }))
  })

  it('leaves the Tags field out when the v2 address book is off', () => {
    mockAddressBookState.mockReturnValue({ ...settledBook, tags: buildSpaceAddressBookTags(2) })
    renderAction()

    fireEvent.click(action()!)

    expect(mockFormProps).toHaveBeenLastCalledWith(expect.objectContaining({ workspaceTags: undefined }))
  })
})
