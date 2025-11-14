import { render, userEvent } from '@/src/tests/test-utils'
import { SafeShieldHeadline } from './SafeShieldHeadline'
import { Severity } from '@safe-global/utils/features/safe-shield/types'

describe('SafeShieldHeadline', () => {
  describe('Severity Types', () => {
    it('should render OK variant with check icon and correct text', () => {
      const { getByText, queryByTestId } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} />)

      expect(getByText('CHECKS PASSED')).toBeTruthy()
      expect(queryByTestId('check-icon')).toBeTruthy()
    })

    it('should render CRITICAL variant with alert-triangle icon and correct text', () => {
      const { getByText, queryByTestId } = render(<SafeShieldHeadline type={`safeShield_${Severity.CRITICAL}`} />)

      expect(getByText('RISK DETECTED')).toBeTruthy()
      expect(queryByTestId('alert-triangle-icon')).toBeTruthy()
    })

    it('should render INFO variant with info icon and correct text', () => {
      const { getByText, queryByTestId } = render(<SafeShieldHeadline type={`safeShield_${Severity.INFO}`} />)

      expect(getByText('REVIEW DETAILS')).toBeTruthy()
      expect(queryByTestId('info-icon')).toBeTruthy()
    })

    it('should render WARN variant with info icon and correct text', () => {
      const { getByText, queryByTestId } = render(<SafeShieldHeadline type={`safeShield_${Severity.WARN}`} />)

      expect(getByText('ISSUES FOUND')).toBeTruthy()
      expect(queryByTestId('info-icon')).toBeTruthy()
    })
  })

  describe('Icon Display', () => {
    it('should render with icon by default', () => {
      const { queryByTestId } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} />)

      expect(queryByTestId('check-icon')).toBeTruthy()
    })

    it('should not render icon when withIcon is false', () => {
      const { queryByTestId } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} withIcon={false} />)

      expect(queryByTestId('check-icon')).not.toBeTruthy()
    })
  })

  describe('Action Label', () => {
    it('should render action label when onPress is provided for OK variant', () => {
      const mockOnPress = jest.fn()
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} onPress={mockOnPress} />)

      expect(getByText('View & Simulate')).toBeTruthy()
    })

    it('should render action label when onPress is provided for CRITICAL variant', () => {
      const mockOnPress = jest.fn()
      const { getByText } = render(
        <SafeShieldHeadline type={`safeShield_${Severity.CRITICAL}`} onPress={mockOnPress} />,
      )

      expect(getByText('View')).toBeTruthy()
    })

    it('should render action label when onPress is provided for INFO variant', () => {
      const mockOnPress = jest.fn()
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.INFO}`} onPress={mockOnPress} />)

      expect(getByText('View')).toBeTruthy()
    })

    it('should render action label when onPress is provided for WARN variant', () => {
      const mockOnPress = jest.fn()
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.WARN}`} onPress={mockOnPress} />)

      expect(getByText('View')).toBeTruthy()
    })

    it('should not render action label when onPress is not provided', () => {
      const { queryByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} />)

      expect(queryByText('View & Simulate')).not.toBeTruthy()
    })
  })

  describe('User Interactions', () => {
    it('should call onPress when pressed', async () => {
      const user = userEvent.setup()
      const mockOnPress = jest.fn()
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} onPress={mockOnPress} />)

      await user.press(getByText('CHECKS PASSED'))

      expect(mockOnPress).toHaveBeenCalledTimes(1)
    })

    it('should not trigger press when onPress is not provided', async () => {
      const user = userEvent.setup()
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} />)

      // Should not throw error
      await user.press(getByText('CHECKS PASSED'))

      // Component should still render
      expect(getByText('CHECKS PASSED')).toBeTruthy()
    })

    it('should be disabled when onPress is not provided', () => {
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} />)

      const touchable = getByText('CHECKS PASSED').parent?.parent
      expect(touchable?.props.disabled).toBe(true)
    })

    it('should not be disabled when onPress is provided', () => {
      const mockOnPress = jest.fn()
      const { getByText } = render(<SafeShieldHeadline type={`safeShield_${Severity.OK}`} onPress={mockOnPress} />)

      const touchable = getByText('CHECKS PASSED').parent?.parent
      expect(touchable?.props.disabled).toBe(false)
    })
  })

  describe('Default Props', () => {
    it('should use OK variant as default type', () => {
      const { getByText } = render(<SafeShieldHeadline />)

      expect(getByText('CHECKS PASSED')).toBeTruthy()
    })

    it('should show icon by default', () => {
      const { queryByTestId } = render(<SafeShieldHeadline />)

      expect(queryByTestId('check-icon')).toBeTruthy()
    })
  })

  describe('Combined Props', () => {
    it('should render all elements when all props are provided', () => {
      const mockOnPress = jest.fn()
      const { getByText, queryByTestId } = render(
        <SafeShieldHeadline type={`safeShield_${Severity.OK}`} onPress={mockOnPress} withIcon={true} />,
      )

      expect(getByText('CHECKS PASSED')).toBeTruthy()
      expect(getByText('View & Simulate')).toBeTruthy()
      expect(queryByTestId('check-icon')).toBeTruthy()
    })

    it('should render only text when withIcon is false and no onPress', () => {
      const { getByText, queryByTestId, queryByText } = render(
        <SafeShieldHeadline type={`safeShield_${Severity.CRITICAL}`} withIcon={false} />,
      )

      expect(getByText('RISK DETECTED')).toBeTruthy()
      expect(queryByTestId('alert-triangle-icon')).not.toBeTruthy()
      expect(queryByText('View')).not.toBeTruthy()
    })
  })
})

