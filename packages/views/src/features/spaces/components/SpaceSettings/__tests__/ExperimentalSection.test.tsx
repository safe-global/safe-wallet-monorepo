import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import ExperimentalSection, { EXPERIMENTAL_ADMIN_ONLY_MESSAGE, type ExperimentalFeature } from '../ExperimentalSection'

jest.mock('@safe-global/views/components/ui/tooltip', () => ({
  Tooltip: ({ children }: { children: ReactNode }) => <div data-testid="tooltip">{children}</div>,
  TooltipTrigger: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-trigger">{children}</div>,
  TooltipContent: ({ children }: { children: ReactNode }) => <div data-testid="tooltip-content">{children}</div>,
}))

const renderSection = (props: Partial<Parameters<typeof ExperimentalSection>[0]> = {}) => {
  const onChange = jest.fn()
  render(<ExperimentalSection enabled={[]} onChange={onChange} isAdmin {...props} />)
  return { onChange, toggle: screen.getByRole('switch', { name: 'Recipient allowlist' }) }
}

describe('ExperimentalSection', () => {
  it('reflects the enabled state on the toggle', () => {
    const { toggle } = renderSection({ enabled: ['POLICY_RECIPIENT_ALLOWLIST'] })

    expect(toggle).toBeChecked()
  })

  it('lets an admin turn the recipient allowlist on', async () => {
    const { toggle, onChange } = renderSection()

    await userEvent.click(toggle)

    expect(onChange).toHaveBeenCalledWith(['POLICY_RECIPIENT_ALLOWLIST'])
  })

  it('keeps features it does not render when toggling one off', async () => {
    const unknownFeature = 'SOME_FUTURE_FEATURE' as ExperimentalFeature
    const { toggle, onChange } = renderSection({ enabled: [unknownFeature, 'POLICY_RECIPIENT_ALLOWLIST'] })

    await userEvent.click(toggle)

    expect(onChange).toHaveBeenCalledWith([unknownFeature])
  })

  it('disables the toggle and explains why for non-admins', async () => {
    const { toggle, onChange } = renderSection({ isAdmin: false })

    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByTestId('tooltip-content')).toHaveTextContent(EXPERIMENTAL_ADMIN_ONLY_MESSAGE)

    await userEvent.click(toggle)

    expect(onChange).not.toHaveBeenCalled()
  })

  it('disables the toggle while saving', () => {
    const { toggle } = renderSection({ isSaving: true })

    expect(toggle).toHaveAttribute('aria-disabled', 'true')
    expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument()
  })
})
