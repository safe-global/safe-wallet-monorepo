import { Box, hslToRgb } from '@mui/material'
import css from 'src/features/spaces/components/InitialsAvatar/styles.module.css'

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

const InitialsAvatar = ({
  name,
  size = 'large',
  rounded = false,
}: {
  name: string
  size?: 'xsmall' | 'small' | 'medium' | 'large'
  rounded?: boolean
}) => {
  const logoLetters = name.slice(0, 1)
  const logoColor = getDeterministicColor(name)
  const dimensions = {
    xsmall: { width: 20, height: 20, fontSize: '12px !important' },
    small: { width: 24, height: 24, fontSize: '12px !important' },
    medium: { width: 32, height: 32, fontSize: '16px !important' },
    large: { width: 48, height: 48, fontSize: '20px !important' },
  }

  const { width, height, fontSize } = dimensions[size]

  return (
    <Box
      className={css.initialsAvatar}
      bgcolor={logoColor}
      width={width}
      height={height}
      fontSize={fontSize}
      borderRadius={rounded ? '50%' : '6px'}
    >
      {logoLetters}
    </Box>
  )
}

export default InitialsAvatar
