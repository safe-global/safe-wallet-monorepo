import { render } from '@/src/tests/test-utils'
import { SafeShieldHeadline } from './SafeShieldHeadline'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

describe('SafeShieldHeadline', () => {
  describe('Severity Types', () => {
    it('should render OK variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.OK} />)

      expect(getByText('CHECKS PASSED')).toBeTruthy()
    })

    it('should render CRITICAL variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.CRITICAL} />)

      expect(getByText('RISK DETECTED')).toBeTruthy()
    })

    it('should render INFO variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.INFO} />)

      expect(getByText('REVIEW DETAILS')).toBeTruthy()
    })

    it('should render WARN variant with correct text', () => {
      const { getByText } = render(<SafeShieldHeadline type={Severity.WARN} />)

      expect(getByText('ISSUES FOUND')).toBeTruthy()
    })
  })

  describe('Default Props', () => {
    it('should use OK variant as default type', () => {
      const { getByText } = render(<SafeShieldHeadline />)

      expect(getByText('CHECKS PASSED')).toBeTruthy()
    })
  })
})
