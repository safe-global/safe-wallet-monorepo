import { getDeterministicColor } from '@/utils/colors'
import css from './styles.module.css'

const InitialsAvatar = ({
  name,
  size = 'large',
  rounded = false,
}: {
  name: string
  size?: 'xxsmall' | 'xsmall' | 'small' | 'medium' | 'large'
  rounded?: boolean
}) => {
  const logoLetters = name.slice(0, 1)
  const logoColor = getDeterministicColor(name)
  const dimensions = {
    xxsmall: { width: 16, height: 16, fontSize: '9px !important' },
    xsmall: { width: 20, height: 20, fontSize: '12px !important' },
    small: { width: 24, height: 24, fontSize: '12px !important' },
    medium: { width: 32, height: 32, fontSize: '16px !important' },
    large: { width: 48, height: 48, fontSize: '20px !important' },
  }

  const { width, height, fontSize } = dimensions[size]

  return (
    <div
      className={css.initialsAvatar}
      style={{
        backgroundColor: logoColor,
        width,
        height,
        minWidth: width,
        minHeight: height,
        flexShrink: 0,
        fontSize,
        borderRadius: rounded ? '50%' : '6px',
      }}
    >
      {logoLetters}
    </div>
  )
}

export default InitialsAvatar
