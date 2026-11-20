import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import local from '@/services/local-storage/local'
import { initialState as settingsInitialState, type SettingsState } from '@/store/settingsSlice'
import Appearance from '@/pages/settings/appearance'
import { useDarkMode } from '@/hooks/useDarkMode'

jest.mock('@/components/settings/SettingsHeader', () => ({ __esModule: true, default: () => null }))

const storeTheme = (theme: SettingsState['theme']) => local.setItem('settings', { ...settingsInitialState, theme })

const AppearanceWithTheme = () => {
  useDarkMode()
  return <Appearance />
}

describe('Settings → Appearance', () => {
  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.theme
    delete document.documentElement.dataset.themeVariant
  })

  it.each([
    [true, 'Dark'],
    [false, 'Light'],
    [undefined, 'System'],
  ])('resolves legacy darkMode=%s to %s', async (darkMode, label) => {
    storeTheme({ darkMode })

    render(<Appearance />)

    await waitFor(() => expect(screen.getByRole('button', { name: label })).toHaveAttribute('aria-pressed', 'true'))
  })

  it('applies a saved GTA VI theme on top of the dark base', async () => {
    storeTheme({ darkMode: true, variant: 'gta6' })

    render(<AppearanceWithTheme />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'GTA VI' })).toHaveAttribute('aria-pressed', 'true')
      expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
      expect(document.documentElement).toHaveAttribute('data-theme-variant', 'gta6')
    })
  })

  it('clears the GTA VI palette when switching back to dark mode', async () => {
    storeTheme({ darkMode: true, variant: 'gta6' })
    render(<AppearanceWithTheme />)
    await waitFor(() => expect(document.documentElement).toHaveAttribute('data-theme-variant', 'gta6'))

    fireEvent.click(screen.getByRole('button', { name: 'Dark' }))

    expect(document.documentElement).toHaveAttribute('data-theme', 'dark')
    expect(document.documentElement).not.toHaveAttribute('data-theme-variant')
  })
})
