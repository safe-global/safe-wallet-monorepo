import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { _getCountdown, Countdown } from '.'

describe('Countdown', () => {
  it('should return null if seconds is <= 0', () => {
    const result = render(<Countdown seconds={0} />)

    expect(result.container).toBeEmptyDOMElement()
  })

  it('should return < 1 min if seconds is <= 60', () => {
    const result = render(<Countdown seconds={faker.number.int({ min: 1, max: 60 })} />)

    expect(result.getByText('< 1 min')).toBeInTheDocument()
  })

  describe('getCountdown', () => {
    it('should convert 0 seconds to 0 days, 0 hours, and 0 minutes', () => {
      const result = _getCountdown(0)
      expect(result).toEqual({ days: 0, hours: 0, minutes: 0 })
    })

    it('should convert 3600 seconds to 0 days, 1 hour, and 0 minutes', () => {
      const result = _getCountdown(3600)
      expect(result).toEqual({ days: 0, hours: 1, minutes: 0 })
    })

    it('should convert 86400 seconds to 1 day, 0 hours, and 0 minutes', () => {
      const result = _getCountdown(86400)
      expect(result).toEqual({ days: 1, hours: 0, minutes: 0 })
    })

    it('should convert 123456 seconds to 1 day, 10 hours, and 17 minutes', () => {
      const result = _getCountdown(123456)
      expect(result).toEqual({ days: 1, hours: 10, minutes: 17 })
    })
  })
})
