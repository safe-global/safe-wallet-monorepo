import { render, screen } from '@/tests/test-utils'
import { initialState as settingsInitialState } from '@/store/settingsSlice'
import Appearance from '@/pages/settings/appearance'

jest.mock('@/components/settings/SettingsHeader', () => ({ __esModule: true, default: () => null }))

const renderWithDarkMode = (darkMode: boolean) =>
  render(<Appearance />, {
    initialReduxState: { settings: { ...settingsInitialState, theme: { ...settingsInitialState.theme, darkMode } } },
  })

describe('Settings → Appearance', () => {
  it('shows dark mode as on when the stored settings ask for it', () => {
    renderWithDarkMode(true)

    expect(screen.getByRole('switch', { name: 'Dark mode' })).toBeChecked()
  })

  it('shows dark mode as off when the stored settings turn it off', () => {
    renderWithDarkMode(false)

    expect(screen.getByRole('switch', { name: 'Dark mode' })).not.toBeChecked()
  })
})
