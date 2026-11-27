import { faker } from '@faker-js/faker'
import userEvent from '@testing-library/user-event'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import type { SuggestedContact } from '@safe-global/views/features/spaces/components/AddressBookV2/types'
import { useUpsertWorkspaceSafeNames } from '../../../public/hooks/useUpsertWorkspaceSafeName'
import { useWorkspaceAddressBookLabel } from '../../../public/hooks/useWorkspaceAddressBookLabel'
import { useCurrentChain } from '@/hooks/useChains'
import { SPACE_EVENTS } from '@/services/analytics/events/spaces'
import { MixpanelEventParams } from '@/services/analytics/mixpanel-events'
import { getStoreInstance } from '@/store'
import { Builder } from '@/tests/Builder'
import { chainBuilder } from '@/tests/builders/chains'
import { render, screen, waitFor, within } from '@/tests/test-utils'
import SuggestedTab from '../SuggestedTab'

jest.mock('@safe-global/views/hooks/use-mobile', () => ({ useIsMobile: () => false }))
jest.mock('../../../public/hooks/useUpsertWorkspaceSafeName', () => ({
  ...jest.requireActual('../../../public/hooks/useUpsertWorkspaceSafeName'),
  useUpsertWorkspaceSafeNames: jest.fn(),
}))
jest.mock('../../../public/hooks/useWorkspaceAddressBookLabel', () => ({ useWorkspaceAddressBookLabel: jest.fn() }))
jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: jest.fn(() => ({ configs: [] })),
  useCurrentChain: jest.fn(),
}))
const mockTrackEvent = jest.fn()
jest.mock('@/services/analytics', () => ({
  ...jest.requireActual('@/services/analytics'),
  trackEvent: (...args: unknown[]) => mockTrackEvent(...args),
}))
jest.mock('@safe-global/views/components/common/Identicon', () => {
  const Identicon = () => <span data-testid="identicon" />
  return Identicon
})
jest.mock('../../SpaceAddressBook/RequestToAddButton', () => {
  const RequestToAddButton = ({ name, location }: { name: string; location?: string }) => (
    <button data-location={location}>Request {name}</button>
  )
  return RequestToAddButton
})

const BOOK_LABEL = `${faker.company.name()} address book`
const CHAIN = {
  chainId: faker.string.numeric(5),
  chainName: faker.company.name(),
  chainLogoUri: null,
  shortName: faker.string.alpha(3),
}

const suggestionBuilder = () =>
  Builder.new<SuggestedContact>().with({
    address: checksumAddress(faker.finance.ethereumAddress()),
    chains: [CHAIN],
    suggestedName: faker.person.fullName(),
    reason: { kind: 'signer', safes: [faker.company.name()] },
  })

type Props = Parameters<typeof SuggestedTab>[0]

const renderTab = (props: Partial<Props> = {}) =>
  render(
    <SuggestedTab
      suggestions={[]}
      isLoading={false}
      isError={false}
      onReload={jest.fn()}
      isAdmin
      isInvited={false}
      isPrivateAddressBookEnabled
      {...props}
    />,
  )

const mockUpsert = (result: { error?: string } = {}) => {
  const upsert = jest.fn().mockResolvedValue(result)
  ;(useUpsertWorkspaceSafeNames as jest.Mock).mockReturnValue(upsert)
  return upsert
}

const notificationMessages = () =>
  getStoreInstance()
    .getState()
    .notifications.map((notification) => notification.message)

const addSelected = async (suggestions: SuggestedContact[]) => {
  for (const suggestion of suggestions) {
    await userEvent.click(screen.getByRole('checkbox', { name: `Select ${suggestion.suggestedName}` }))
  }
  await userEvent.click(screen.getByRole('button', { name: `Add ${suggestions.length} to Workspace` }))
  return screen.findByRole('dialog')
}

const SEARCH_LABEL = 'Search contacts by name, address or Safe'

const uniqueSuggestion = () =>
  suggestionBuilder()
    .with({
      suggestedName: `${faker.string.alpha(12)} signer 1`,
      reason: { kind: 'signer', safes: [faker.string.alpha(12)] },
    })
    .build()

describe('SuggestedTab', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpsert()
    ;(useWorkspaceAddressBookLabel as jest.Mock).mockReturnValue(BOOK_LABEL)
    ;(useCurrentChain as jest.Mock).mockReturnValue(chainBuilder().build())
  })

  it('shows loading and no suggestions while the book loads', () => {
    renderTab({ suggestions: [suggestionBuilder().build()], isLoading: true })

    expect(screen.getByTestId('suggestions-loading')).toBeInTheDocument()
    expect(screen.queryByTestId('table-row')).not.toBeInTheDocument()
  })

  it('shows the load error with a reload button', async () => {
    const onReload = jest.fn()
    renderTab({ isError: true, onReload })

    await userEvent.click(within(screen.getByTestId('suggestions-error')).getByRole('button', { name: 'Reload' }))

    expect(onReload).toHaveBeenCalledTimes(1)
    expect(screen.queryByTestId('table-row')).not.toBeInTheDocument()
  })

  it('adds the chosen suggestions in one request and reports the count', async () => {
    const upsert = mockUpsert()
    const [first, second] = [suggestionBuilder().build(), suggestionBuilder().build()]
    const newName = faker.person.fullName()
    renderTab({ suggestions: [first, second] })

    const dialog = await addSelected([first, second])
    await userEvent.type(within(dialog).getByRole('textbox', { name: `Name for ${second.suggestedName}` }), newName)
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 2 contacts' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(upsert).toHaveBeenCalledTimes(1)
    expect(upsert).toHaveBeenCalledWith([
      { address: first.address, name: first.suggestedName, chainIds: [CHAIN.chainId] },
      { address: second.address, name: newName, chainIds: [CHAIN.chainId] },
    ])
    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SUGGESTED_CONTACTS_ADDED, {
      [MixpanelEventParams.ENTRY_COUNT]: 2,
      [MixpanelEventParams.RENAMED_COUNT]: 1,
      [MixpanelEventParams.LOCATION]: 'bulk',
    })
    expect(notificationMessages()).toContain(`2 contacts added to ${BOOK_LABEL}`)
  })

  it('reports a single row add from the row button', async () => {
    const suggestion = suggestionBuilder().build()
    renderTab({ suggestions: [suggestion] })

    await userEvent.click(screen.getByRole('button', { name: 'Add to Workspace' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Add 1 contact' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(mockTrackEvent).toHaveBeenCalledWith(SPACE_EVENTS.SUGGESTED_CONTACTS_ADDED, {
      [MixpanelEventParams.ENTRY_COUNT]: 1,
      [MixpanelEventParams.RENAMED_COUNT]: 0,
      [MixpanelEventParams.LOCATION]: 'row',
    })
    expect(notificationMessages()).toContain(`Contact added to ${BOOK_LABEL}`)
  })

  it('keeps the dialog open with the error when the save fails', async () => {
    const message = faker.lorem.sentence()
    mockUpsert({ error: message })
    const suggestion = suggestionBuilder().build()
    renderTab({ suggestions: [suggestion] })

    await userEvent.click(screen.getByRole('button', { name: 'Add to Workspace' }))
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Add 1 contact' }))

    expect(await within(screen.getByRole('dialog')).findByRole('alert')).toHaveTextContent(message)
    expect(mockTrackEvent).not.toHaveBeenCalled()
  })

  it('keeps the dialog open while the save is in progress', async () => {
    let finishSave: (result: { error?: string }) => void = () => {}
    ;(useUpsertWorkspaceSafeNames as jest.Mock).mockReturnValue(
      () => new Promise<{ error?: string }>((resolve) => (finishSave = resolve)),
    )
    renderTab({ suggestions: [suggestionBuilder().build()] })

    await userEvent.click(screen.getByRole('button', { name: 'Add to Workspace' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add 1 contact' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    finishSave({})
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('offers Request to add to members when private address books are on', () => {
    const suggestion = suggestionBuilder().build()
    renderTab({ suggestions: [suggestion], isAdmin: false })

    expect(screen.getByRole('button', { name: `Request ${suggestion.suggestedName}` })).toHaveAttribute(
      'data-location',
      'suggested',
    )
    expect(screen.queryByRole('button', { name: 'Add to Workspace' })).not.toBeInTheDocument()
  })

  it('shows members no action when private address books are off', () => {
    const suggestion = suggestionBuilder().build()
    renderTab({ suggestions: [suggestion], isAdmin: false, isPrivateAddressBookEnabled: false })

    expect(screen.queryByRole('button', { name: `Request ${suggestion.suggestedName}` })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to Workspace' })).not.toBeInTheDocument()
  })

  it('shows invited people no action', () => {
    const suggestion = suggestionBuilder().build()
    renderTab({ suggestions: [suggestion], isAdmin: false, isInvited: true })

    expect(screen.queryByRole('button', { name: `Request ${suggestion.suggestedName}` })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Add to Workspace' })).not.toBeInTheDocument()
  })

  describe('search', () => {
    it.each([
      { field: 'suggested name', queryOf: (item: SuggestedContact) => item.suggestedName.slice(0, 8) },
      { field: 'address', queryOf: (item: SuggestedContact) => item.address.slice(6, 18).toLowerCase() },
      { field: 'Safe name', queryOf: (item: SuggestedContact) => item.reason.safes[0].toUpperCase() },
    ])('narrows the list by $field', async ({ queryOf }) => {
      const [match, other] = [uniqueSuggestion(), uniqueSuggestion()]
      renderTab({ suggestions: [match, other] })

      await userEvent.type(screen.getByLabelText(SEARCH_LABEL), queryOf(match))

      expect(screen.getByText(match.suggestedName)).toBeInTheDocument()
      expect(screen.queryByText(other.suggestedName)).not.toBeInTheDocument()
    })

    it('shows no results and clears the search', async () => {
      const suggestion = uniqueSuggestion()
      renderTab({ suggestions: [suggestion] })

      await userEvent.type(screen.getByLabelText(SEARCH_LABEL), 'no such suggestion')
      const noResults = screen.getByTestId('address-book-no-results')

      await userEvent.click(within(noResults).getByRole('button', { name: 'Clear search' }))

      expect(screen.getByText(suggestion.suggestedName)).toBeInTheDocument()
    })

    it('unselects a row the search hides', async () => {
      const [kept, hidden] = [uniqueSuggestion(), uniqueSuggestion()]
      renderTab({ suggestions: [kept, hidden] })
      await userEvent.click(screen.getByRole('checkbox', { name: `Select ${kept.suggestedName}` }))
      await userEvent.click(screen.getByRole('checkbox', { name: `Select ${hidden.suggestedName}` }))

      await userEvent.type(screen.getByLabelText(SEARCH_LABEL), kept.suggestedName)
      await userEvent.clear(screen.getByLabelText(SEARCH_LABEL))

      expect(screen.getByRole('button', { name: 'Add 1 to Workspace' })).toBeInTheDocument()
      expect(screen.getByRole('checkbox', { name: `Select ${hidden.suggestedName}` })).not.toBeChecked()
    })

    it('has no search when there are no suggestions', () => {
      renderTab({ suggestions: [] })

      expect(screen.queryByLabelText(SEARCH_LABEL)).not.toBeInTheDocument()
      expect(screen.getByTestId('suggestions-empty')).toBeInTheDocument()
    })
  })
})
