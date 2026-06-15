import { hslToRgb } from '@mui/material'

/**
 * Returns a deterministic "random" color (in Hex format) based on a string.
 * The color is constrained so it won't be too dark or too light or too saturated.
 */
export function getDeterministicColor(str: string): string {
  const sum = [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const hue = sum % 360
  const saturation = 40 + (sum % 31)
  const lightness = 40 + (sum % 31)

  return hslToRgb(`hsl(${hue}, ${saturation}, ${lightness})`)
}
