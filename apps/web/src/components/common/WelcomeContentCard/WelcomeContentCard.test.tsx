import { render, screen } from '@/tests/test-utils'
import WelcomeContentCard from '.'

describe('WelcomeContentCard', () => {
  it('renders its children on a white card surface', () => {
    render(
      <WelcomeContentCard data-testid="card">
        <span>Inside the card</span>
      </WelcomeContentCard>,
    )

    const card = screen.getByTestId('card')
    expect(card).toBeInTheDocument()
    expect(card).toHaveClass('bg-card')
    expect(screen.getByText('Inside the card')).toBeInTheDocument()
  })

  it('forwards extra class names', () => {
    render(<WelcomeContentCard data-testid="card" className="custom-class" />)

    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })
})
