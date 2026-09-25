import { render, screen } from '@/tests/test-utils'
import { highlightSafePro } from '../index'

describe('highlightSafePro', () => {
  it('wraps each "Safe Pro" and keeps the sentence intact', () => {
    render(<h2>{highlightSafePro('Workspaces run on Safe Pro, and Safe Pro only')}</h2>)

    expect(screen.getByRole('heading')).toHaveTextContent('Workspaces run on Safe Pro, and Safe Pro only')
    expect(screen.getAllByText('Safe Pro')).toHaveLength(2)
  })

  it('returns plain text when there is nothing to highlight', () => {
    expect(highlightSafePro('Your free access ended on Dec 5, 2026')).toBe('Your free access ended on Dec 5, 2026')
  })
})
