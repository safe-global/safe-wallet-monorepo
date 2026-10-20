import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import ExperimentalSection, {
  EXPERIMENTAL_ADMIN_ONLY_MESSAGE,
  EXPERIMENTAL_EMPTY_MESSAGE,
  type ExperimentalFeature,
} from '../ExperimentalSection'

jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

const renderSection = (props: Partial<Parameters<typeof ExperimentalSection>[0]> = {}) => {
  const onChange = jest.fn()
  render(
    <ExperimentalSection
      available={['POLICY_RECIPIENT_ALLOWLIST']}
      enabled={[]}
      onChange={onChange}
      isAdmin
      {...props}
    />,
  )
  return { onChange, toggle: screen.queryByRole('switch', { name: 'Recipient allowlist' }) }
}

describe('ExperimentalSection', () => {
  it('reflects the enabled state on the toggle', () => {
    const { toggle } = renderSection({ enabled: ['POLICY_RECIPIENT_ALLOWLIST'] })

    expect(toggle).toBeChecked()
  })

  it('lets an admin turn the recipient allowlist on', async () => {
    const { toggle, onChange } = renderSection()

    await userEvent.click(toggle!)

    expect(onChange).toHaveBeenCalledWith(['POLICY_RECIPIENT_ALLOWLIST'])
  })

  it('keeps features it does not render when toggling one off', async () => {
    const unknownFeature = 'SOME_FUTURE_FEATURE' as ExperimentalFeature
    const { toggle, onChange } = renderSection({ enabled: [unknownFeature, 'POLICY_RECIPIENT_ALLOWLIST'] })

    await userEvent.click(toggle!)

    expect(onChange).toHaveBeenCalledWith([unknownFeature])
  })

  it('shows the empty state and no switches when nothing is available', () => {
    const { toggle } = renderSection({ available: [] })

    expect(toggle).not.toBeInTheDocument()
    expect(screen.getByTestId('experimental-empty')).toHaveTextContent(EXPERIMENTAL_EMPTY_MESSAGE)
  })

  it('does not render a row whose key is not available even if it is enabled', () => {
    const { toggle } = renderSection({ available: [], enabled: ['POLICY_RECIPIENT_ALLOWLIST'] })

    expect(toggle).not.toBeInTheDocument()
  })

  it('disables the toggle and explains why for non-admins', async () => {
    const { toggle, onChange } = renderSection({ isAdmin: false })

    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(EXPERIMENTAL_ADMIN_ONLY_MESSAGE)

    await userEvent.click(toggle!)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables the toggle while saving', () => {
    const { toggle } = renderSection({ isSaving: true })

    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })

  it('disables the toggle without a spinner when disabled', async () => {
    const { toggle, onChange } = renderSection({ disabled: true })

    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByRole('status', { name: 'Loading' })).not.toBeInTheDocument()

    await userEvent.click(toggle!)

    expect(onChange).not.toHaveBeenCalled()
  })
})
