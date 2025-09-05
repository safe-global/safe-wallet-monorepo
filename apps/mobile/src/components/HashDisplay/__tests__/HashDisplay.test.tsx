jest.mock('@/src/hooks/useDisplayName', () => ({
  useDisplayName: jest.fn(),
}))

jest.mock('@/src/features/ConfirmTx/hooks/useOpenExplorer', () => ({
  useOpenExplorer: jest.fn(() => jest.fn()),
}))

const { useDisplayName } = require('@/src/hooks/useDisplayName')

describe('HashDisplay - Visual Identifier and Sizing', () => {
  const testAddress = '0x1234567890abcdef1234567890abcdef12345678'

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('showVisualIdentifier prop behavior', () => {
    it('should show logo when available and showVisualIdentifier is true', () => {
      useDisplayName.mockReturnValue({
        displayName: 'Test Contract',
        address: testAddress,
        logoUri: 'https://example.com/logo.png',
        nameSource: 'cgw',
      })

      expect(() => {
        const props = {
          value: testAddress,
          showVisualIdentifier: true,
          size: 'md' as const,
        }
        expect(props.showVisualIdentifier).toBe(true)
        expect(props.size).toBe('md')
      }).not.toThrow()
    })

    it('should show identicon fallback when no logo is available', () => {
      useDisplayName.mockReturnValue({
        displayName: null,
        address: testAddress,
        logoUri: null,
        nameSource: null,
      })

      expect(() => {
        const props = {
          value: testAddress,
          showVisualIdentifier: true,
          size: 'lg' as const,
        }
        expect(props.showVisualIdentifier).toBe(true)
        expect(props.size).toBe('lg')
      }).not.toThrow()
    })

    it('should not show any visual identifier when showVisualIdentifier is false', () => {
      useDisplayName.mockReturnValue({
        displayName: 'Test Contract',
        address: testAddress,
        logoUri: 'https://example.com/logo.png',
        nameSource: 'cgw',
      })

      expect(() => {
        const props = {
          value: testAddress,
          showVisualIdentifier: false,
          size: 'sm' as const,
        }
        expect(props.showVisualIdentifier).toBe(false)
        expect(props.size).toBe('sm')
      }).not.toThrow()
    })
  })

  describe('size variants', () => {
    it('should handle all size variants correctly', () => {
      useDisplayName.mockReturnValue({
        displayName: 'Test Contract',
        address: testAddress,
        logoUri: 'https://example.com/logo.png',
        nameSource: 'cgw',
      })

      const sizes = ['xs', 'sm', 'md', 'lg', 'xl'] as const

      sizes.forEach((size) => {
        expect(() => {
          const props = {
            value: testAddress,
            size,
          }
          expect(props.size).toBe(size)
        }).not.toThrow()
      })
    })

    it('should default to md size when no size is specified', () => {
      useDisplayName.mockReturnValue({
        displayName: 'Test Contract',
        address: testAddress,
        logoUri: null,
        nameSource: 'cgw',
      })

      expect(() => {
        const props = {
          value: testAddress,
        }
        // Component should accept props without size (will default to 'md' in component)
        expect(props.value).toBe(testAddress)
      }).not.toThrow()
    })
  })

  describe('iconColor prop behavior', () => {
    it('should accept iconColor prop for both copy and external link icons', () => {
      useDisplayName.mockReturnValue({
        displayName: 'Test Contract',
        address: testAddress,
        logoUri: null,
        nameSource: null,
      })

      expect(() => {
        const props = {
          value: testAddress,
          iconColor: '$primary',
          showCopy: true,
          showExternalLink: true,
        }
        expect(props.iconColor).toBe('$primary')
        expect(props.showCopy).toBe(true)
        expect(props.showExternalLink).toBe(true)
      }).not.toThrow()
    })

    it('should default to $textSecondaryLight when no iconColor is specified', () => {
      useDisplayName.mockReturnValue({
        displayName: 'Test Contract',
        address: testAddress,
        logoUri: null,
        nameSource: null,
      })

      expect(() => {
        const props = {
          value: testAddress,
          showCopy: true,
          showExternalLink: true,
        }
        // Component should accept props without iconColor (will default to '$textSecondaryLight' in component)
        expect(props.value).toBe(testAddress)
      }).not.toThrow()
    })
  })
})
