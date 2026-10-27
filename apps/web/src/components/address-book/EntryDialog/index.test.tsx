import { faker } from '@faker-js/faker'
import { fakerChecksummedAddress, fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import EntryDialog from './index'
import { useUpsertWorkspaceSafeName } from '@/features/spaces'
import * as addressBookSlice from '@/store/addressBookSlice'
import { getStoreInstance } from '@/store'
import { chainBuilder } from '@/tests/builders/chains'
import { mockChainId } from '@/tests/mocks/hooks'
import { FEATURES } from '@safe-global/store/gateway/types'

const SEPOLIA = '11155111'
const mockSepolia = chainBuilder()
  .with({ chainId: SEPOLIA, isTestnet: true, features: [FEATURES.DOMAIN_LOOKUP] })
  .build()
const mockEnsAddress = fakerChecksummedAddress()

jest.mock('@/hooks/useChainId')

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: [mockSepolia], loading: false, error: undefined }),
  useChain: () => mockSepolia,
  useCurrentChain: () => mockSepolia,
  useHasFeature: () => false,
}))

jest.mock('@/components/common/AddressInput/useNameResolver', () => ({
  __esModule: true,
  getEnsNotAvailableError: () => 'ENS name not available',
  default: (value: string) => ({
    address: value === 'treasury.eth' ? mockEnsAddress : undefined,
    name: value === 'treasury.eth' ? value : undefined,
    resolving: false,
  }),
}))

jest.mock('@/features/spaces/hooks/useUpsertWorkspaceSafeName', () => ({
  useUpsertWorkspaceSafeName: jest.fn(),
}))

jest.mock('@/features/spaces/hooks/useWorkspaceAddressBookLabel', () => ({
  useWorkspaceAddressBookLabel: () => 'Acme address book',
}))

jest.mock('@safe-global/views/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

const typeName = (name: string) => {
  const field = screen.getByTestId('name-input')
  const input = (field.tagName === 'INPUT' ? field : field.querySelector('input')) as HTMLInputElement
  fireEvent.change(input, { target: { value: name } })
}

const save = async (name = 'Treasury') => {
  typeName(name)
  await waitFor(() => expect(screen.getByTestId('save-btn')).not.toBeDisabled())
  fireEvent.click(screen.getByTestId('save-btn'))
}

beforeEach(() => {
  mockChainId(SEPOLIA)
})

describe('EntryDialog', () => {
  it('renders a create-entry dialog', () => {
    render(<EntryDialog handleClose={jest.fn()} />)

    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('modal-title')).toHaveTextContent('Create entry')
  })

  /**
   * Rename is opened from three surfaces that are themselves overlays (the Trusted Safes modal, the
   * safe-selector dropdown, the "Manage my account list" dialog). All of them portal into the same
   * container, so at equal z-index the winner is whichever mounted last — the callers raise this
   * dialog explicitly, and the prop carrying that used to be dropped silently on the way through.
   * ModalDialog owns the other half of the contract (a forwarded `z-*` replaces its own).
   */
  it('routes the caller stacking classes to the popup and the backdrop', () => {
    render(<EntryDialog handleClose={jest.fn()} className="popup-marker" overlayClassName="overlay-marker" />)

    const popup = screen.getByTestId('entry-dialog')
    const overlay = document.querySelector('[data-slot="dialog-overlay"]')

    expect(popup).toHaveClass('popup-marker')
    expect(popup).not.toHaveClass('overlay-marker')
    expect(overlay).toHaveClass('overlay-marker')
    expect(overlay).not.toHaveClass('popup-marker')
  })

  it('saves the address an ENS name resolves to', async () => {
    const name = faker.person.firstName()
    render(<EntryDialog handleClose={jest.fn()} />)

    fireEvent.change(screen.getByRole('textbox', { name: /address/i }), { target: { value: 'treasury.eth' } })
    await save(name)

    await waitFor(() => expect(getStoreInstance().getState().addressBook[SEPOLIA]?.[mockEnsAddress]).toBe(name))
  })
})

describe('EntryDialog scope', () => {
  const ADDRESS = '0x1111111111111111111111111111111111111111'
  const upsertWorkspaceName = jest.fn().mockResolvedValue({})

  beforeEach(() => {
    jest.clearAllMocks()
    upsertWorkspaceName.mockResolvedValue({})
    ;(useUpsertWorkspaceSafeName as jest.Mock).mockReturnValue(upsertWorkspaceName)
  })

  const renderDialog = (scope?: 'local' | 'workspace', chainIds = ['1']) =>
    render(
      <EntryDialog
        handleClose={jest.fn()}
        scope={scope}
        chainIds={chainIds}
        defaultValues={{ name: 'Old name', address: ADDRESS }}
        disableAddressInput
      />,
    )

  it('blocks Save and marks the name invalid when the name is cleared', async () => {
    renderDialog()
    typeName('')

    await waitFor(() => expect(screen.getByTestId('save-btn')).toBeDisabled())
    expect(screen.getByTestId('name-input')).toHaveAttribute('aria-invalid', 'true')
  })

  it('writes to the workspace address book when scoped to workspace', async () => {
    renderDialog('workspace')
    await save()

    await waitFor(() =>
      expect(upsertWorkspaceName).toHaveBeenCalledWith({ name: 'Treasury', address: ADDRESS, chainIds: ['1'] }),
    )
  })

  it('writes locally by default', async () => {
    const spy = jest.spyOn(addressBookSlice, 'upsertAddressBookEntries')
    renderDialog()
    await save()

    await waitFor(() => expect(spy).toHaveBeenCalled())
    expect(upsertWorkspaceName).not.toHaveBeenCalled()
  })

  it('names the Safe on every given network in the local address book', async () => {
    renderDialog(undefined, ['1', '137'])
    await save('Treasury')

    await waitFor(() => {
      const { addressBook } = getStoreInstance().getState()
      expect([addressBook['1']?.[ADDRESS], addressBook['137']?.[ADDRESS]]).toEqual(['Treasury', 'Treasury'])
    })
  })

  it('names the workspace it is about to write to, and stays silent for a local write', () => {
    const { unmount } = renderDialog('workspace')
    expect(screen.getByTestId('entry-scope-notice')).toHaveTextContent(
      'This name is saved to Acme address book and is visible to everyone in the Workspace.',
    )
    unmount()

    renderDialog('local')
    expect(screen.queryByTestId('entry-scope-notice')).not.toBeInTheDocument()
  })

  it('surfaces a fallback error when the submit itself rejects', async () => {
    upsertWorkspaceName.mockRejectedValue(new Error('boom'))
    renderDialog('workspace')
    await save()

    await waitFor(() => expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument())
    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
    expect(screen.getByTestId('save-btn')).not.toBeDisabled()
  })

  it('keeps the dialog open and shows the reason when the workspace write is rejected', async () => {
    upsertWorkspaceName.mockResolvedValue({ error: 'Forbidden' })
    renderDialog('workspace')
    await save()

    await waitFor(() => expect(screen.getByText('Forbidden')).toBeInTheDocument())
    expect(screen.getByTestId('entry-dialog')).toBeInTheDocument()
  })

  // The workspace write already sanitized; the local one did not, so the same name took two shapes.
  it('sanitizes the name on the local path too', async () => {
    const spy = jest.spyOn(addressBookSlice, 'upsertAddressBookEntries')
    renderDialog('local')
    await save('  Treasury  ')

    await waitFor(() => expect(spy).toHaveBeenCalledWith(expect.objectContaining({ name: 'Treasury' })))
  })
})
