import lightPalette from './light'
import darkPalette from './dark'
import type { ColorPalette } from './types'

describe('Color Palettes', () => {
  const palettes: { name: string; palette: ColorPalette }[] = [
    { name: 'light', palette: lightPalette },
    { name: 'dark', palette: darkPalette },
  ]

  describe.each(palettes)('$name palette', ({ palette }) => {
    it('should have text colors', () => {
      expect(palette.text.primary).toBeDefined()
      expect(palette.text.secondary).toBeDefined()
      expect(palette.text.disabled).toBeDefined()
      expect(palette.text.contrast).toBeDefined()
    })

    it('should have primary colors', () => {
      expect(palette.primary.dark).toBeDefined()
      expect(palette.primary.main).toBeDefined()
      expect(palette.primary.light).toBeDefined()
    })

    it('should have secondary colors', () => {
      expect(palette.secondary.dark).toBeDefined()
      expect(palette.secondary.main).toBeDefined()
      expect(palette.secondary.light).toBeDefined()
      expect(palette.secondary.background).toBeDefined()
    })

    it('should have semantic colors', () => {
      expect(palette.error.main).toBeDefined()
      expect(palette.success.main).toBeDefined()
      expect(palette.info.main).toBeDefined()
      expect(palette.warning.main).toBeDefined()
    })

    it('should have background colors', () => {
      expect(palette.background.default).toBeDefined()
      expect(palette.background.main).toBeDefined()
      expect(palette.background.paper).toBeDefined()
      expect(palette.background.light).toBeDefined()
      expect(palette.background.secondary).toBeDefined()
    })

    it('should have all color values as valid hex or rgba', () => {
      const colorRegex = /^#[0-9A-Fa-f]{6}$|^#[0-9A-Fa-f]{8}$|^rgba?\(/

      const checkColors = (obj: Record<string, unknown>, path = ''): void => {
        Object.entries(obj).forEach(([key, value]) => {
          const currentPath = path ? `${path}.${key}` : key
          if (typeof value === 'object' && value !== null) {
            checkColors(value as Record<string, unknown>, currentPath)
          } else if (typeof value === 'string') {
            expect(value).toMatch(colorRegex)
          }
        })
      }

      checkColors(palette as unknown as Record<string, unknown>)
    })
  })

  describe('palette consistency', () => {
    it('should have same structure in light and dark palettes', () => {
      const lightKeys = Object.keys(lightPalette).sort()
      const darkKeys = Object.keys(darkPalette).sort()

      expect(lightKeys).toEqual(darkKeys)
    })

    it('should have same nested structure in both palettes', () => {
      const getNestedKeys = (obj: Record<string, unknown>, prefix = ''): string[] => {
        return Object.entries(obj).flatMap(([key, value]) => {
          const path = prefix ? `${prefix}.${key}` : key
          if (typeof value === 'object' && value !== null) {
            return getNestedKeys(value as Record<string, unknown>, path)
          }
          return [path]
        })
      }

      const lightNestedKeys = getNestedKeys(lightPalette as unknown as Record<string, unknown>).sort()
      const darkNestedKeys = getNestedKeys(darkPalette as unknown as Record<string, unknown>).sort()

      expect(lightNestedKeys).toEqual(darkNestedKeys)
    })
  })
})
