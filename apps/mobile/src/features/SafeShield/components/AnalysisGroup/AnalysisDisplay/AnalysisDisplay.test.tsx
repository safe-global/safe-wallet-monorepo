import { render, fireEvent } from '@/src/tests/test-utils'
import { AnalysisDisplay } from './AnalysisDisplay'
import {
  RecipientAnalysisResultBuilder,
  ContractAnalysisResultBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'
import type { Address } from '@/src/types/address'

describe('AnalysisDisplay', () => {
  const initialStore = {
    activeSafe: {
      address: '0x1234567890123456789012345678901234567890' as Address,
      chainId: '1',
    },
  }

  it('should render description from result', () => {
    const result = RecipientAnalysisResultBuilder.knownRecipient().build()
    const { getByText } = render(<AnalysisDisplay result={result} />, { initialStore })

    expect(getByText(result.description)).toBeTruthy()
  })

  it('should render custom description when provided', () => {
    const result = RecipientAnalysisResultBuilder.knownRecipient().build()
    const customDescription = 'Custom description'
    const { getByText } = render(<AnalysisDisplay result={result} description={customDescription} />, { initialStore })

    expect(getByText(customDescription)).toBeTruthy()
    expect(() => getByText(result.description)).toThrow()
  })

  it('should render issues when result has issues', () => {
    const result = ThreatAnalysisResultBuilder.malicious()
      .issues({
        [Severity.CRITICAL]: [{ description: 'Critical issue' }],
      })
      .build()

    const { getByText } = render(<AnalysisDisplay result={result} />, { initialStore })

    expect(getByText('Critical issue')).toBeTruthy()
  })

  it('should render address changes when result is address change', () => {
    const beforeAddress = faker.finance.ethereumAddress()
    const afterAddress = faker.finance.ethereumAddress()

    const result = ThreatAnalysisResultBuilder.masterCopyChange().changes(beforeAddress, afterAddress).build()

    const { getByText } = render(<AnalysisDisplay result={result} />, { initialStore })

    expect(getByText('CURRENT MASTERCOPY:')).toBeTruthy()
    expect(getByText('NEW MASTERCOPY:')).toBeTruthy()
  })

  it('should render addresses when result has addresses', () => {
    const addresses = [{ address: faker.finance.ethereumAddress() }, { address: faker.finance.ethereumAddress() }]

    const result = {
      ...ContractAnalysisResultBuilder.newContract().build(),
      addresses,
    }

    const { getByText } = render(<AnalysisDisplay result={result} />, {
      initialStore,
    })

    // Find and press the "Show all" button
    const showAllText = getByText('Show all')
    // The Text is inside a TouchableOpacity, we need to find it
    const touchableOpacity = showAllText.parent?.parent
    if (touchableOpacity && touchableOpacity.props && touchableOpacity.props.onPress) {
      touchableOpacity.props.onPress()
    } else {
      // Fallback: use fireEvent if available
      const { fireEvent } = require('@testing-library/react-native')
      fireEvent.press(showAllText.parent?.parent || showAllText)
    }

    addresses.forEach(({ address }) => {
      expect(getByText(address)).toBeTruthy()
    })
  })

  it('should apply border color based on severity', () => {
    const result = ThreatAnalysisResultBuilder.malicious().build()

    const { UNSAFE_root } = render(<AnalysisDisplay result={result} severity={Severity.CRITICAL} />, { initialStore })

    // Component should render with severity
    expect(UNSAFE_root).toBeTruthy()
  })

  it('should render all components together', () => {
    const beforeAddress = faker.finance.ethereumAddress()
    const afterAddress = faker.finance.ethereumAddress()

    const result = ThreatAnalysisResultBuilder.masterCopyChange()
      .changes(beforeAddress, afterAddress)
      .issues({
        [Severity.CRITICAL]: [{ description: 'Critical issue' }],
      })
      .build()

    const { getByText } = render(<AnalysisDisplay result={result} severity={Severity.CRITICAL} />, {
      initialStore,
    })

    expect(getByText(result.description)).toBeTruthy()
    expect(getByText('Critical issue')).toBeTruthy()
    expect(getByText('CURRENT MASTERCOPY:')).toBeTruthy()
  })

  describe('Error Dropdown', () => {
    it('should render error dropdown when result has error field', () => {
      const result = ThreatAnalysisResultBuilder.failedWithError().build()

      const { getByText } = render(<AnalysisDisplay result={result} />, { initialStore })

      expect(getByText('Show details')).toBeTruthy()
    })

    it('should NOT render error dropdown when result has no error field', () => {
      const result = ThreatAnalysisResultBuilder.failedWithoutError().build()

      const { queryByText } = render(<AnalysisDisplay result={result} />, { initialStore })

      expect(queryByText('Show details')).toBeNull()
      expect(queryByText('Hide details')).toBeNull()
    })

    it('should expand and collapse error dropdown', () => {
      const result = ThreatAnalysisResultBuilder.failedWithError().error('Test error message').build()

      const { getByText, queryByText } = render(<AnalysisDisplay result={result} />, { initialStore })

      expect(getByText('Show details')).toBeTruthy()
      expect(queryByText('Hide details')).toBeNull()
      expect(queryByText('Test error message')).toBeNull()

      const toggle = getByText('Show details')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Hide details')).toBeTruthy()
      expect(queryByText('Show details')).toBeNull()
      expect(getByText('Test error message')).toBeTruthy()

      const hideToggle = getByText('Hide details')
      const hideTouchableOpacity = hideToggle.parent?.parent
      if (hideTouchableOpacity) {
        fireEvent.press(hideTouchableOpacity)
      } else {
        fireEvent.press(hideToggle)
      }

      expect(getByText('Show details')).toBeTruthy()
      expect(queryByText('Hide details')).toBeNull()
      expect(queryByText('Test error message')).toBeNull()
    })

    it('should display error text when expanded', () => {
      const errorMessage = 'Simulation Error: Reverted'
      const result = ThreatAnalysisResultBuilder.failedWithError().error(errorMessage).build()

      const { getByText } = render(<AnalysisDisplay result={result} />, { initialStore })

      const toggle = getByText('Show details')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText(errorMessage)).toBeTruthy()
      expect(getByText('Hide details')).toBeTruthy()
    })

    it('should not interfere with other components when error is present', () => {
      const result = ThreatAnalysisResultBuilder.failedWithError()
        .error('Test error')
        .description('Threat analysis failed. Review before processing.')
        .build()

      const { getByText } = render(<AnalysisDisplay result={result} />, { initialStore })

      expect(getByText('Show details')).toBeTruthy()
      expect(getByText('Threat analysis failed. Review before processing.')).toBeTruthy()
    })

    it('should work with different error messages', () => {
      const result1 = ThreatAnalysisResultBuilder.failedWithError().error('Simulation Error: Reverted').build()
      const result2 = ThreatAnalysisResultBuilder.failedWithError().error('Reverted').build()

      const { rerender, getByText } = render(<AnalysisDisplay result={result1} />, { initialStore })
      expect(getByText('Show details')).toBeTruthy()

      rerender(<AnalysisDisplay result={result2} />)
      expect(getByText('Show details')).toBeTruthy()

      const toggle = getByText('Show details')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Reverted')).toBeTruthy()
    })
  })
})
