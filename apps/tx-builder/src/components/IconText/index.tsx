import React from 'react'
import styled from 'styled-components'
import { type Theme } from '@mui/material/styles'

import { Icon, IconProps, IconType } from '../Icon'
import Text from '../Text'

const iconTextMargins = {
  xxs: '4px',
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  xxl: '24px',
}

type IconMargins = keyof typeof iconTextMargins

type Props = {
  iconType: keyof IconType
  iconSize: IconProps['size']
  iconColor?: keyof Theme['palette']
  margin?: IconMargins
  color?: keyof Theme['palette']
  text: string
  className?: string
  iconSide?: 'left' | 'right'
}

const LeftIconText = styled.div<{ margin: IconMargins }>`
  display: flex;
  align-items: center;
  svg {
    margin: 0 ${({ margin }) => iconTextMargins[margin]} 0 0;
  }
`

const RightIconText = styled.div<{ margin: IconMargins }>`
  display: flex;
  align-items: center;
  svg {
    margin: 0 0 0 ${({ margin }) => iconTextMargins[margin]};
  }
`

/**
 * The `IconText` renders an icon next to a text
 */
const IconText = ({
  iconSize,
  margin = 'xs',
  iconType,
  iconColor,
  text,
  iconSide = 'left',
  color,
  className,
}: Props): React.ReactElement => {
  return iconSide === 'right' ? (
    <RightIconText className={className} margin={margin}>
      <Text color={color}>{text}</Text>
      <Icon size={iconSize} type={iconType} color={iconColor} />
    </RightIconText>
  ) : (
    <LeftIconText className={className} margin={margin}>
      <Icon size={iconSize} type={iconType} color={iconColor} />
      <Text color={color}>{text}</Text>
    </LeftIconText>
  )
}

export default IconText
