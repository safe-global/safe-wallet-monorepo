import { render, screen, waitFor } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import Appearance from '@/pages/settings/appearance'

jest.mock('@/components/settings/SettingsHeader', () => ({ __esModule: true, default: () => null }))

const storeDarkMode = (darkMode: boolean) =>
  local.setItem('settings', { ...settingsInitialState, theme: { ...settingsInitialState.theme, darkMode } })

describe('Settings → Appearance', () => {
  afterEach(() => localStorage.clear())

  it('shows dark mode as on when the persisted settings ask for it', async () => {
    storeDarkMode(true)

    render(<Appearance />)

    await waitFor(() => expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked())
  })

  it('shows dark mode as off when the persisted settings turn it off', async () => {
    storeDarkMode(false)

    render(<Appearance />)

    await waitFor(() => expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked())
  })
})
