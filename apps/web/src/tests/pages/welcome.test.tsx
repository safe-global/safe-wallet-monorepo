import { render } from '@testing-library/react'
import WelcomePage from '../../pages/welcome/index'

jest.mock('@/components/welcome/NewSafe', () => ({
  __esModule: true,
  default: () => <div data-testid="legacy-welcome" />,
}))

describe('WelcomePage', () => {
  it('renders the legacy welcome screen', () => {
    const { getByTestId } = render(<WelcomePage />)

    expect(getByTestId('legacy-welcome')).toBeInTheDocument()
  })
})
