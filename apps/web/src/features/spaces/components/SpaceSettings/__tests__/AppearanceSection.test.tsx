import { fireEvent, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import AppearanceSection from '../sections/AppearanceSection'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  SETTINGS_EVENTS: {
    APPEARANCE: {
      DARK_MODE: { action: 'Dark mode', category: 'settings' },
      COPY_PREFIXES: { action: 'Copy prefixes', category: 'settings' },
    },
  },
}))

const renderWithStore = () => {
  const store = makeStore(undefined, { skipBroadcast: true })
  return {
    store,
    ...render(
      <Provider store={store}>
        <AppearanceSection />
      </Provider>,
    ),
  }
}

describe('AppearanceSection', () => {
  it('selects "system" by default when no theme preference is set', () => {
    renderWithStore()
    expect(screen.getByTestId('theme-card-system')).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByTestId('theme-card-system')).toHaveAttribute('data-slot', 'button')
    expect(screen.getByTestId('theme-card-system').querySelector('[aria-hidden="true"]')?.className).not.toContain(
      'border-[',
    )
    expect(screen.getByTestId('theme-card-dark')).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByTestId('theme-card-light')).toHaveAttribute('aria-pressed', 'false')
  })

  it('persists the theme choice to settingsSlice when a card is clicked', () => {
    const { store } = renderWithStore()

    fireEvent.click(screen.getByTestId('theme-card-dark'))
    expect(store.getState().settings.theme.darkMode).toBe(true)

    fireEvent.click(screen.getByTestId('theme-card-light'))
    expect(store.getState().settings.theme.darkMode).toBe(false)

    fireEvent.click(screen.getByTestId('theme-card-system'))
    expect(store.getState().settings.theme.darkMode).toBeUndefined()
  })
})
