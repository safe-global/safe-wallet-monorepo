import { render, screen } from '@/tests/test-utils'
import SelectedCounter, { safeLimitTooltip } from '../index'

describe('SelectedCounter', () => {
  it('reads the count against the limit as a selection', () => {
    render(<SelectedCounter count={3} limit={20} isAtLimit={false} tooltip="tip" />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent('3 of 20 selected')
    expect(screen.getByTestId('selected-count')).not.toHaveClass('text-warning-strong')
  })

  it('drops the limit when the plan has none', () => {
    render(<SelectedCounter count={3} limit={null} isAtLimit={false} tooltip="tip" />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent(/^3 selected$/)
  })

  it('reads as plain usage without the selected suffix', () => {
    render(<SelectedCounter count={2} limit={20} isAtLimit={false} tooltip="tip" showSelected={false} />)

    expect(screen.getByTestId('selected-count')).toHaveTextContent(/^2 of 20$/)
  })

  it('turns into a warning at the limit', () => {
    render(<SelectedCounter count={20} limit={20} isAtLimit tooltip="tip" />)

    expect(screen.getByTestId('selected-count')).toHaveClass('text-warning-strong')
  })
})

describe('safeLimitTooltip', () => {
  it('names the cap, or says there is none', () => {
    expect(safeLimitTooltip(5)).toBe('You can add up to 5 Safe accounts per Workspace')
    expect(safeLimitTooltip(null)).toBe('Your plan has no limit on Safe accounts per Workspace')
  })
})
