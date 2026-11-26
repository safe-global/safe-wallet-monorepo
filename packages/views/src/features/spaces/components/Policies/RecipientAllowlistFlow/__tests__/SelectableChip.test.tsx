import { renderWithUserEvent, screen } from '@/tests/test-utils'
import SelectableChip from '../SelectableChip'

const ICON = <span data-testid="chip-icon" />

describe('SelectableChip', () => {
  it.each([true, false])('should, when selected is %s, reflect it in aria-pressed', (selected) => {
    renderWithUserEvent(
      <SelectableChip selected={selected} onToggle={jest.fn()} aria-label="Allow USDC" icon={ICON} label="USDC" />,
    )

    expect(screen.getByRole('button', { name: 'Allow USDC' })).toHaveAttribute('aria-pressed', String(selected))
  })

  it.each([true, false])('should, when clicked with selected %s, call onToggle with the opposite', async (selected) => {
    const onToggle = jest.fn()
    const { user } = renderWithUserEvent(
      <SelectableChip selected={selected} onToggle={onToggle} aria-label="Allow USDC" icon={ICON} label="USDC" />,
    )

    await user.click(screen.getByRole('button', { name: 'Allow USDC' }))

    expect(onToggle).toHaveBeenCalledWith(!selected)
  })

  it('should, when given a subline, render it under the label', () => {
    renderWithUserEvent(
      <SelectableChip
        selected
        onToggle={jest.fn()}
        aria-label="Allow Alice"
        icon={ICON}
        label="Alice"
        subline={<span>0x1234…abcd</span>}
      />,
    )

    expect(screen.getByRole('button', { name: 'Allow Alice' })).toHaveTextContent('Alice0x1234…abcd')
  })
})
