import { fireEvent, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { initialState } from '@/store/settingsSlice'
import SecuritySettings from '.'

describe('SecuritySettings', () => {
  it('renders the blind signing setting and toggles the preference', () => {
    render(<SecuritySettings />, {
      initialReduxState: {
        settings: {
          ...initialState,
          signing: {
            ...initialState.signing,
            blindSigning: false,
          },
        },
      },
    })

    const checkbox = screen.getByRole('checkbox')

    expect(screen.getByText('Security')).toBeInTheDocument()
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(checkbox)

    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })
})
