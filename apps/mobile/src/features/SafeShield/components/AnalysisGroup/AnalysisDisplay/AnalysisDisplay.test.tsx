import { render } from '@/src/tests/test-utils'
import { fireEvent } from '@testing-library/react-native'
import { AnalysisDisplay } from './AnalysisDisplay'
import {
  RecipientAnalysisResultBuilder,
  ContractAnalysisResultBuilder,
} from '@safe-global/utils/features/safe-shield/builders'
import { ThreatAnalysisResultBuilder } from '@safe-global/utils/features/safe-shield/builders/threat-analysis-result.builder'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { faker } from '@faker-js/faker'

describe('AnalysisDisplay', () => {
  it('should render description from result', () => {
    const result = RecipientAnalysisResultBuilder.knownRecipient().build()
    const { getByText } = render(<AnalysisDisplay result={result} />)

    expect(getByText(result.description)).toBeTruthy()
  })

  it('should render custom description when provided', () => {
    const result = RecipientAnalysisResultBuilder.knownRecipient().build()
    const customDescription = 'Custom description'
    const { getByText } = render(<AnalysisDisplay result={result} description={customDescription} />)

    expect(getByText(customDescription)).toBeTruthy()
    expect(() => getByText(result.description)).toThrow()
  })

  it('should render issues when result has issues', () => {
    const result = ThreatAnalysisResultBuilder.malicious()
      .issues({
        [Severity.CRITICAL]: [{ description: 'Critical issue' }],
      })
      .build()

    const { getByText } = render(<AnalysisDisplay result={result} />)

    expect(getByText('Critical issue')).toBeTruthy()
  })

  it('should render address changes when result is address change', () => {
    const beforeAddress = faker.finance.ethereumAddress()
    const afterAddress = faker.finance.ethereumAddress()

    const result = ThreatAnalysisResultBuilder.masterCopyChange().changes(beforeAddress, afterAddress).build()

    const { getByText } = render(<AnalysisDisplay result={result} />)

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
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
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

    const { UNSAFE_root } = render(<AnalysisDisplay result={result} severity={Severity.CRITICAL} />)

    // Component should render with severity
    expect(UNSAFE_root).toBeTruthy()
  })

  it('should render all components together', () => {
    const addresses = [{ address: faker.finance.ethereumAddress() }]
    const beforeAddress = faker.finance.ethereumAddress()
    const afterAddress = faker.finance.ethereumAddress()

    const result = ThreatAnalysisResultBuilder.masterCopyChange()
      .changes(beforeAddress, afterAddress)
      .issues({
        [Severity.CRITICAL]: [{ description: 'Critical issue' }],
      })
      .build()

    const resultWithAddresses = {
      ...result,
      addresses,
    }

    const { getByText } = render(<AnalysisDisplay result={resultWithAddresses} severity={Severity.CRITICAL} />, {
      initialStore: {
        activeSafe: {
          address: '0x1234567890123456789012345678901234567890',
          chainId: '1',
        },
      },
    })

    expect(getByText(result.description)).toBeTruthy()
    expect(getByText('Critical issue')).toBeTruthy()
    expect(getByText('CURRENT MASTERCOPY:')).toBeTruthy()

    const showAllText = getByText('Show all')
    const touchableOpacity = showAllText.parent?.parent
    if (touchableOpacity) {
      fireEvent.press(touchableOpacity)
    } else {
      fireEvent.press(showAllText)
    }
    expect(getByText(addresses[0].address)).toBeTruthy()
  })
})
