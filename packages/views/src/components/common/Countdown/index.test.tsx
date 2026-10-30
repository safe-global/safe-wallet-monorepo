import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { Countdown } from '.'

describe('Countdown', () => {
  it('should return null if seconds is <= 0', () => {
    const result = render(<Countdown seconds={0} />)

    expect(result.container).toBeEmptyDOMElement()
  })

  it('should return < 1 min if seconds is <= 60', () => {
    const result = render(<Countdown seconds={faker.number.int({ min: 1, max: 60 })} />)

    expect(result.getByText('< 1 min')).toBeInTheDocument()
  })
})
