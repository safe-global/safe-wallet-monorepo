import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import EntryDialog from './index'
import { useUpsertWorkspaceSafeName } from '@/features/spaces'
import * as addressBookSlice from '@/store/addressBookSlice'

jest.mock('@/features/spaces/hooks/useUpsertWorkspaceSafeName', () => ({
  useUpsertWorkspaceSafeName: jest.fn(),
}))

jest.mock('@/features/spaces/hooks/useWorkspaceAddressBookLabel', () => ({
  useWorkspaceAddressBookLabel: () => 'Acme address book',
}))

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

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
})

describe('EntryDialog scope', () => {
  const ADDRESS = '0x1111111111111111111111111111111111111111'
  const upsertWorkspaceName = jest.fn().mockResolvedValue({})

  beforeEach(() => {
    jest.clearAllMocks()
    upsertWorkspaceName.mockResolvedValue({})
    ;(useUpsertWorkspaceSafeName as jest.Mock).mockReturnValue(upsertWorkspaceName)
  })

  const renderDialog = (scope?: 'local' | 'workspace') =>
    render(
      <EntryDialog
        handleClose={jest.fn()}
        scope={scope}
        chainIds={['1']}
        defaultValues={{ name: 'Old name', address: ADDRESS }}
        disableAddressInput
      />,
    )

  const save = async (name = 'Treasury') => {
    const field = screen.getByTestId('name-input')
    const input = (field.tagName === 'INPUT' ? field : field.querySelector('input')) as HTMLInputElement
    fireEvent.change(input, { target: { value: name } })
    await waitFor(() => expect(screen.getByTestId('save-btn')).not.toBeDisabled())
    fireEvent.click(screen.getByTestId('save-btn'))
  }

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

  it('names the workspace it is about to write to, and stays silent for a local write', () => {
    const { unmount } = renderDialog('workspace')
    expect(screen.getByTestId('entry-scope-notice')).toHaveTextContent(
      'This name is saved to Acme address book and is visible to everyone in the workspace.',
    )
    unmount()

    renderDialog('local')
    expect(screen.queryByTestId('entry-scope-notice')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and shows the reason when the workspace write is rejected', async () => {
    upsertWorkspaceName.mockResolvedValue({ error: 'Only ADMINs can edit' })
    renderDialog('workspace')
    await save()

    await waitFor(() => expect(screen.getByText('Only ADMINs can edit')).toBeInTheDocument())
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
