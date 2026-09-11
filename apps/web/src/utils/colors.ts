/**
 * Converts an HSL color (h in degrees, s/l in percent) to an `rgb(r, g, b)` string,
 * matching the output format MUI's `hslToRgb` produced.
 */
function hslToRgbString(h: number, s: number, l: number): string {
  const sFrac = s / 100
  const lFrac = l / 100
  const a = sFrac * Math.min(lFrac, 1 - lFrac)
  const channel = (n: number): number => {
    const k = (n + h / 30) % 12
    const color = lFrac - a * Math.max(Math.min(k - 3, 9 - k, 1), -1)
    return Math.round(255 * color)
  }
  return `rgb(${channel(0)}, ${channel(8)}, ${channel(4)})`
}

/**
 * Returns a deterministic "random" color (in rgb format) based on a string.
 * The color is constrained so it won't be too dark or too light or too saturated.
 */
export function getDeterministicColor(str: string): string {
  const sum = [...str].reduce((acc, char) => acc + char.charCodeAt(0), 0)

  const hue = sum % 360
  const saturation = 40 + (sum % 31)
  const lightness = 40 + (sum % 31)

  return hslToRgbString(hue, saturation, lightness)
}
