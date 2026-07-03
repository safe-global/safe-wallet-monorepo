import { fireEvent, screen } from '@testing-library/react'
import { render } from '@/tests/test-utils'
import { initialState } from '@/store/settingsSlice'
import SecuritySettings from '.'

describe('SecuritySettings', () => {
  it('renders the blind signing setting in a shadcn settings card and toggles the preference', () => {
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

    const title = screen.getByText('Security')
    const checkbox = screen.getByRole('checkbox')

    expect(title.closest('[data-slot="card"]')).toHaveClass('p-8')
    expect(checkbox).toHaveAttribute('aria-checked', 'false')

    fireEvent.click(checkbox)

    expect(checkbox).toHaveAttribute('aria-checked', 'true')
  })
})
