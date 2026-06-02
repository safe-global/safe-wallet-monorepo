import { Box } from '@mui/material'
import { getDeterministicColor } from '@/utils/colors'
import css from './styles.module.css'

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
      minWidth={width}
      minHeight={height}
      flexShrink={0}
      fontSize={fontSize}
      borderRadius={rounded ? '50%' : '6px'}
    >
      {logoLetters}
    </Box>
  )
}

export default InitialsAvatar
