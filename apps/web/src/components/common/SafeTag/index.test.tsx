import { render } from '@/tests/test-utils'
import SafeTag from '.'

describe('SafeTag', () => {
  it('renders the Safe label', () => {
    const { getByText, getByTestId } = render(<SafeTag />)

    expect(getByTestId('safe-tag')).toBeInTheDocument()
    expect(getByText('Safe')).toBeInTheDocument()
  })
})
