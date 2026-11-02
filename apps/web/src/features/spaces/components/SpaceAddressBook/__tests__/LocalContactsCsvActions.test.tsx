import userEvent from '@testing-library/user-event'
import { render, screen, waitFor } from '@/tests/test-utils'
import { trackEvent } from '@/services/analytics'
import { ADDRESS_BOOK_EVENTS } from '@/services/analytics/events/addressBook'
import LocalContactsCsvActions from '../LocalContactsCsvActions'

jest.mock('@/services/analytics')

describe('LocalContactsCsvActions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('opens and closes the import dialog', async () => {
    render(<LocalContactsCsvActions hasContacts={false} />)

    await userEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(screen.getByText('Import address book')).toBeInTheDocument()

    await userEvent.click(screen.getByTestId('cancel-btn'))
    await waitFor(() => expect(screen.queryByText('Import address book')).not.toBeInTheDocument())
  })

  it('opens and closes the export dialog', async () => {
    render(<LocalContactsCsvActions hasContacts />)

    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(screen.getByText('Export address book')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Export address book')).not.toBeInTheDocument())
  })

  it('disables export when there are no local contacts', () => {
    render(<LocalContactsCsvActions hasContacts={false} />)

    expect(screen.getByRole('button', { name: 'Export' })).toBeDisabled()
  })

  it('labels the button clicks as coming from the Workspace local contacts', async () => {
    render(<LocalContactsCsvActions hasContacts />)

    await userEvent.click(screen.getByRole('button', { name: 'Import' }))
    expect(trackEvent).toHaveBeenCalledWith(
      { ...ADDRESS_BOOK_EVENTS.IMPORT_BUTTON, label: 'workspace_local_contacts' },
      undefined,
    )

    await userEvent.click(screen.getByTestId('cancel-btn'))
    await userEvent.click(screen.getByRole('button', { name: 'Export' }))
    expect(trackEvent).toHaveBeenCalledWith(
      { ...ADDRESS_BOOK_EVENTS.DOWNLOAD_BUTTON, label: 'workspace_local_contacts' },
      undefined,
    )
  })
})
