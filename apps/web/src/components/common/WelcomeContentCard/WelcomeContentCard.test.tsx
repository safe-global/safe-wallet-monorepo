import { render, screen } from '@/tests/test-utils'
import WelcomeContentCard from '.'

describe('WelcomeContentCard', () => {
  it('renders its children inside the card', () => {
    render(
      <WelcomeContentCard data-testid="card">
        <span>Inside the card</span>
      </WelcomeContentCard>,
    )

    expect(screen.getByTestId('card')).toBeInTheDocument()
    expect(screen.getByText('Inside the card')).toBeInTheDocument()
  })

  it('forwards extra class names', () => {
    render(<WelcomeContentCard data-testid="card" className="custom-class" />)

    expect(screen.getByTestId('card')).toHaveClass('custom-class')
  })
})
