import { render } from '@/src/tests/test-utils'
import { Fiat } from '.'

describe('Fiat', () => {
  it('should render the default markup', () => {
    const { getByText } = render(<Fiat value="215,531.65" currency="usd" />)

    expect(getByText('$')).toBeTruthy()
    expect(getByText('215,531')).toBeTruthy()
    expect(getByText('.65')).toBeTruthy()
  })
})
