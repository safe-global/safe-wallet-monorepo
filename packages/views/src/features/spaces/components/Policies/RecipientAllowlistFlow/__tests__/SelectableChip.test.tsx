import { renderWithUserEvent, screen } from '@/tests/test-utils'
import SelectableChip from '../SelectableChip'

describe('SelectableChip', () => {
  it.each([true, false])('reflects selected=%s in aria-pressed', (selected) => {
    renderWithUserEvent(
      <SelectableChip selected={selected} onToggle={jest.fn()} aria-label="USDC">
        USDC
      </SelectableChip>,
    )

    expect(screen.getByRole('button', { name: 'USDC' })).toHaveAttribute('aria-pressed', String(selected))
  })

  it.each([true, false])('calls onToggle with the opposite of selected=%s on click', async (selected) => {
    const onToggle = jest.fn()
    const { user } = renderWithUserEvent(
      <SelectableChip selected={selected} onToggle={onToggle} aria-label="USDC">
        USDC
      </SelectableChip>,
    )

    await user.click(screen.getByRole('button', { name: 'USDC' }))

    expect(onToggle).toHaveBeenCalledWith(!selected)
  })
})
