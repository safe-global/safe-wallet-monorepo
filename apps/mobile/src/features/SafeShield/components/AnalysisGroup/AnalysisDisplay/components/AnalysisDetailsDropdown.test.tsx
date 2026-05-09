import { render, fireEvent } from '@/src/tests/test-utils'
import { AnalysisDetailsDropdown } from './AnalysisDetailsDropdown'
import { Text, View } from 'tamagui'

describe('AnalysisDetailsDropdown', () => {
  describe('Basic Rendering', () => {
    it('should render the component with default "Show all" label', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown>
          <Text>Test content</Text>
        </AnalysisDetailsDropdown>,
      )

      expect(getByText('Show all')).toBeTruthy()
    })

    it('should render with custom labels', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown showLabel="Show details" hideLabel="Hide details">
          <Text>Test content</Text>
        </AnalysisDetailsDropdown>,
      )

      expect(getByText('Show details')).toBeTruthy()
    })

    it('should not display content initially (collapsed)', () => {
      const { getByText, queryByText } = render(
        <AnalysisDetailsDropdown>
          <Text>Test content</Text>
        </AnalysisDetailsDropdown>,
      )

      expect(getByText('Show all')).toBeTruthy()
      expect(queryByText('Test content')).toBeNull()
    })
  })

  describe('Expand/Collapse Functionality', () => {
    it('should expand when toggle is pressed', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown>
          <Text>Test content</Text>
        </AnalysisDetailsDropdown>,
      )

      const toggle = getByText('Show all')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Hide all')).toBeTruthy()
      expect(getByText('Test content')).toBeTruthy()
    })

    it('should collapse when toggle is pressed again', () => {
      const { getByText, queryByText } = render(
        <AnalysisDetailsDropdown>
          <Text>Test content</Text>
        </AnalysisDetailsDropdown>,
      )

      const toggle = getByText('Show all')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Hide all')).toBeTruthy()

      const hideToggle = getByText('Hide all')
      const hideTouchableOpacity = hideToggle.parent?.parent
      if (hideTouchableOpacity) {
        fireEvent.press(hideTouchableOpacity)
      } else {
        fireEvent.press(hideToggle)
      }

      expect(getByText('Show all')).toBeTruthy()
      expect(queryByText('Test content')).toBeNull()
    })

    it('should work with custom labels', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown showLabel="Show details" hideLabel="Hide details">
          <Text>Error message</Text>
        </AnalysisDetailsDropdown>,
      )

      const toggle = getByText('Show details')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Hide details')).toBeTruthy()
      expect(getByText('Error message')).toBeTruthy()
    })
  })

  describe('Content Wrapper', () => {
    it('should use content wrapper when provided', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown
          contentWrapper={(children) => (
            <View backgroundColor="$backgroundPaper" padding="$2" borderRadius="$1">
              {children}
            </View>
          )}
        >
          <Text>Wrapped content</Text>
        </AnalysisDetailsDropdown>,
      )

      const toggle = getByText('Show all')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Wrapped content')).toBeTruthy()
    })

    it('should render children directly when no wrapper is provided', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown>
          <Text>Direct content</Text>
        </AnalysisDetailsDropdown>,
      )

      const toggle = getByText('Show all')
      const touchableOpacity = toggle.parent?.parent
      if (touchableOpacity) {
        fireEvent.press(touchableOpacity)
      } else {
        fireEvent.press(toggle)
      }

      expect(getByText('Direct content')).toBeTruthy()
    })
  })

  describe('Default Expanded State', () => {
    it('should be expanded when defaultExpanded is true', () => {
      const { getByText } = render(
        <AnalysisDetailsDropdown defaultExpanded>
          <Text>Pre-expanded content</Text>
        </AnalysisDetailsDropdown>,
      )

      expect(getByText('Hide all')).toBeTruthy()
      expect(getByText('Pre-expanded content')).toBeTruthy()
    })

    it('should be collapsed when defaultExpanded is false', () => {
      const { getByText, queryByText } = render(
        <AnalysisDetailsDropdown defaultExpanded={false}>
          <Text>Collapsed content</Text>
        </AnalysisDetailsDropdown>,
      )

      expect(getByText('Show all')).toBeTruthy()
      expect(queryByText('Collapsed content')).toBeNull()
    })
  })

  describe('Multiple Toggles', () => {
    it('should toggle multiple times correctly', () => {
      const { getByText, queryByText } = render(
        <AnalysisDetailsDropdown>
          <Text>Toggle test content</Text>
        </AnalysisDetailsDropdown>,
      )

      // First toggle: expand
      const toggle1 = getByText('Show all')
      const touchableOpacity1 = toggle1.parent?.parent
      if (touchableOpacity1) {
        fireEvent.press(touchableOpacity1)
      } else {
        fireEvent.press(toggle1)
      }
      expect(getByText('Hide all')).toBeTruthy()
      expect(getByText('Toggle test content')).toBeTruthy()

      // Second toggle: collapse
      const toggle2 = getByText('Hide all')
      const touchableOpacity2 = toggle2.parent?.parent
      if (touchableOpacity2) {
        fireEvent.press(touchableOpacity2)
      } else {
        fireEvent.press(toggle2)
      }
      expect(getByText('Show all')).toBeTruthy()
      expect(queryByText('Toggle test content')).toBeNull()

      // Third toggle: expand again
      const toggle3 = getByText('Show all')
      const touchableOpacity3 = toggle3.parent?.parent
      if (touchableOpacity3) {
        fireEvent.press(touchableOpacity3)
      } else {
        fireEvent.press(toggle3)
      }
      expect(getByText('Hide all')).toBeTruthy()
      expect(getByText('Toggle test content')).toBeTruthy()
    })
  })
})
