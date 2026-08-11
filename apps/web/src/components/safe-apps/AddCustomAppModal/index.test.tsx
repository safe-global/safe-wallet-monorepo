import { act, fireEvent, render, screen } from '@/tests/test-utils'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { fetchSafeAppFromManifest } from '@/services/safe-apps/manifest'
import { AddCustomAppModal } from '.'

jest.mock('@/services/safe-apps/manifest', () => ({
  fetchSafeAppFromManifest: jest.fn(),
}))

const mockFetchSafeAppFromManifest = jest.mocked(fetchSafeAppFromManifest)

const listedApp: SafeAppData = {
  id: 1,
  url: 'https://listed-app.com',
  name: 'Listed App',
  description: 'A Safe App fixture',
  iconUrl: 'https://listed-app.com/icon.png',
  chainIds: ['1'],
  accessControl: { type: 'NO_RESTRICTIONS' },
  tags: [],
  features: [],
  socialProfiles: [],
  featured: false,
}

const defaultProps = {
  open: true,
  onClose: jest.fn(),
  onSave: jest.fn(),
  safeAppsList: [listedApp],
}

describe('AddCustomAppModal', () => {
  beforeEach(() => {
    // No manifest by default, so the app preview stays absent unless a test opts in
    mockFetchSafeAppFromManifest.mockReset()
  })

  it('shows an error message when the URL is invalid', async () => {
    render(<AddCustomAppModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/Safe App URL/i), { target: { value: 'not-a-url' } })

    expect(await screen.findByRole('alert')).toHaveTextContent('The url is invalid')
  })

  it('shows an error message when the URL is cleared', async () => {
    render(<AddCustomAppModal {...defaultProps} />)

    const input = screen.getByLabelText(/Safe App URL/i)
    fireEvent.change(input, { target: { value: 'https://example.com' } })
    // Flush the async validation of the first change before clearing, as a user typing would
    await act(async () => {})
    fireEvent.change(input, { target: { value: '' } })

    expect(await screen.findByRole('alert')).toHaveTextContent('URL is required')
  })

  it('confirms the app is already registered instead of showing a field error', async () => {
    mockFetchSafeAppFromManifest.mockResolvedValue({ ...listedApp, safeAppsPermissions: [] })
    render(<AddCustomAppModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/Safe App URL/i), { target: { value: listedApp.url } })

    expect(await screen.findByText(/already registered/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('does not offer the risk acknowledgement for an app that is already registered', async () => {
    mockFetchSafeAppFromManifest.mockResolvedValue({ ...listedApp, safeAppsPermissions: [] })
    render(<AddCustomAppModal {...defaultProps} />)

    fireEvent.change(screen.getByLabelText(/Safe App URL/i), { target: { value: listedApp.url } })

    await screen.findByText(/already registered/i)
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
