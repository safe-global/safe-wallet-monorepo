import { render } from '@/src/tests/test-utils'
import { SafeShieldHeadline } from './SafeShieldHeadline'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

describe('SafeShieldHeadline', () => {
  describe('Severity Types', () => {
    it('should render OK variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.OK} />)

      expect(getByText('Checks passed')).toBeTruthy()
    })

    it('should render CRITICAL variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.CRITICAL} />)

      expect(getByText('Risk detected')).toBeTruthy()
    })

    it('should render INFO variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.INFO} />)

      expect(getByText('Review details')).toBeTruthy()
    })

    it('should render WARN variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.WARN} />)

      expect(getByText('Issues found')).toBeTruthy()
    })
  })

  describe('Default Props', () => {
    it('should use OK variant as default type', () => {
      const { getByText } = render(<SafeShieldHeadline />)

      expect(getByText('Checks passed')).toBeTruthy()
    })
  })

  describe('Error State', () => {
    it('should render Checks unavailable when severity is ERROR', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.ERROR} />)

      expect(getByText('Checks unavailable')).toBeTruthy()
    })
  })
})
