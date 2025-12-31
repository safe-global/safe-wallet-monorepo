import tinycolor from 'tinycolor2'

/**
 * Generate a numeric hash from a string using SHA-256
 * Adapted from Vercel's gradient.ts for web
 */
async function hash(input: string): Promise<number> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))

  // Sum all byte values to create numeric hash
  return hashArray.reduce((sum, byte) => sum + byte, 0)
}

/**
 * Generate hue angle (0-359) from input string
 */
async function hue(input: string): Promise<number> {
  const hashValue = await hash(input)
  return hashValue % 360
}

/**
 * Generate gradient colors from Ethereum address
 * Returns { fromColor, toColor } as hex strings
 */
export async function generateGradient(address: string): Promise<{ fromColor: string; toColor: string }> {
  const hueValue = await hue(address)

  // Primary color: HSL with computed hue, 95% saturation, 50% lightness
  const primaryColor = tinycolor({ h: hueValue, s: 0.95, l: 0.5 })

  // Secondary color: Use triadic color scheme (120° offset)
  const triadColors = primaryColor.triad()
  const secondaryColor = triadColors[1]

  return {
    fromColor: primaryColor.toHexString(),
    toColor: secondaryColor.toHexString(),
  }
}
