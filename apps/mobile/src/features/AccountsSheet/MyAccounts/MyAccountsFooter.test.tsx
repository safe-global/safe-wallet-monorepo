import { render } from '@/src/tests/test-utils'
import { MyAccountsFooter } from './MyAccountsFooter'
import { SharedValue } from 'react-native-reanimated'

describe('MyAccountsFooter', () => {
  it('should render the defualt template', () => {
    const container = render(<MyAccountsFooter animatedFooterPosition={2 as unknown as SharedValue<number>} />)

    expect(container.getByText('Add Existing Account')).toBeDefined()
    expect(container.getByText('Join New Account')).toBeDefined()
  })
})
