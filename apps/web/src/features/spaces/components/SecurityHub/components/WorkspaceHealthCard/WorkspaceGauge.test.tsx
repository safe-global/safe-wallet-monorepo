import { render, screen } from '@testing-library/react'
import { ScoreGauge } from './WorkspaceGauge'

// The two <circle>s are, in order: [0] the background track, [1] the colored progress arc.
const getCircles = (container: HTMLElement) => {
  const [track, progress] = Array.from(container.querySelectorAll('circle'))
  return { track, progress }
}

const dashLength = (circle: Element) => Number(circle.getAttribute('stroke-dasharray')?.split(' ')[0])

describe('ScoreGauge', () => {
  it('renders the score and the "of 100" label', () => {
    render(<ScoreGauge scorePct={78} color="success.main" />)

    expect(screen.getByText('78')).toBeInTheDocument()
    expect(screen.getByText('of 100')).toBeInTheDocument()
  })

  it('draws the track with the border.light theme CSS var', () => {
    const { container } = render(<ScoreGauge scorePct={50} color="success.main" />)

    expect(getCircles(container).track).toHaveAttribute('stroke', 'var(--color-border-light)')
  })

  it.each([
    ['success.main', 'var(--color-success-main)'],
    ['error.dark', 'var(--color-error-dark)'],
    ['warning.main', 'var(--color-warning-main)'],
  ])('converts the MUI palette token %s to its CSS var for the progress arc', (token, expected) => {
    const { container } = render(<ScoreGauge scorePct={50} color={token} />)

    expect(getCircles(container).progress).toHaveAttribute('stroke', expected)
  })

  it('passes through a plain CSS color untouched', () => {
    const { container } = render(<ScoreGauge scorePct={50} color="#ff0000" />)

    expect(getCircles(container).progress).toHaveAttribute('stroke', '#ff0000')
  })

  it('renders an empty progress arc at 0%', () => {
    const { container } = render(<ScoreGauge scorePct={0} color="success.main" />)

    expect(dashLength(getCircles(container).progress)).toBe(0)
  })

  it('fills the full track arc at 100%', () => {
    const { container } = render(<ScoreGauge scorePct={100} color="success.main" />)
    const { track, progress } = getCircles(container)

    expect(progress.getAttribute('stroke-dasharray')).toBe(track.getAttribute('stroke-dasharray'))
  })

  it('clamps a score above 100 to the full arc', () => {
    const { container } = render(<ScoreGauge scorePct={150} color="success.main" />)
    const { track, progress } = getCircles(container)

    expect(dashLength(progress)).toBeCloseTo(dashLength(track))
  })

  it('clamps a negative score to an empty arc', () => {
    const { container } = render(<ScoreGauge scorePct={-20} color="success.main" />)

    expect(dashLength(getCircles(container).progress)).toBe(0)
  })
})
