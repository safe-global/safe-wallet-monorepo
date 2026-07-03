import { act, fireEvent, render } from '@/tests/test-utils'
import { initialState } from '@/store/settingsSlice'
import { SafeAppsSigningMethod } from '.'

jest.mock('@/services/analytics', () => ({
  trackEvent: jest.fn(),
  SETTINGS_EVENTS: {
    SAFE_APPS: {
      CHANGE_SIGNING_METHOD: { action: 'Safe apps signing method changed', category: 'settings' },
    },
  },
}))

describe('SafeAppsSigningMethod', () => {
  it('Toggle on-chain signing', async () => {
    const result = render(<SafeAppsSigningMethod />, {
      initialReduxState: {
        settings: {
          ...initialState,
          signing: {
            onChainSigning: false,
            blindSigning: false,
          },
        },
      },
    })

    const checkbox = result.getByRole('checkbox')
    expect(result.getByText('Signing method').closest('[data-slot="card"]')).toHaveClass('mt-4')
    expect(checkbox).not.toBeChecked()

    act(() => fireEvent.click(checkbox))

    expect(checkbox).toBeChecked()

    act(() => fireEvent.click(checkbox))

    expect(checkbox).not.toBeChecked()
  })
})
