import { render } from '@/src/tests/test-utils'
import { MyAccountsFooter } from './MyAccountsFooter'

describe('MyAccountsFooter', () => {
  it('should render the defualt template', () => {
    const container = render(<MyAccountsFooter />)

    expect(container.getByText('Add existing account')).toBeDefined()
    expect(container.getByText('Join new account')).toBeDefined()
  })
})
