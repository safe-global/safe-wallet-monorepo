import { flattenPalette } from './flatten'

describe('flattenPalette', () => {
  it('should flatten a simple nested object', () => {
    const input = {
      text: {
        primary: '#000',
        secondary: '#666',
      },
    }

    const result = flattenPalette(input)

    expect(result).toEqual({
      textPrimary: '#000',
      textSecondary: '#666',
    })
  })

  it('should add suffix when provided', () => {
    const input = {
      text: {
        primary: '#000',
      },
    }

    const result = flattenPalette(input, { suffix: 'Light' })

    expect(result).toEqual({
      textPrimaryLight: '#000',
    })
  })

  it('should handle deeply nested objects', () => {
    const input = {
      colors: {
        brand: {
          primary: '#12FF80',
        },
      },
    }

    const result = flattenPalette(input)

    expect(result).toEqual({
      colorsBrandPrimary: '#12FF80',
    })
  })

  it('should handle empty object', () => {
    const result = flattenPalette({})
    expect(result).toEqual({})
  })

  it('should handle object with only string values', () => {
    const input = {
      primary: '#000',
      secondary: '#666',
    }

    const result = flattenPalette(input)

    expect(result).toEqual({
      primary: '#000',
      secondary: '#666',
    })
  })
})
