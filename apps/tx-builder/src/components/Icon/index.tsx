import React from 'react'
import styled from 'styled-components'

import { type Theme } from '@mui/material/styles'
import { Tooltip } from '../Tooltip'

import alert from './images/alert'
import bookmark from './images/bookmark'
import bookmarkFilled from './images/bookmarkFilled'
import check from './images/check'
import code from './images/code'
import copy from './images/copy'
import cross from './images/cross'
import deleteIcon from './images/delete'
import edit from './images/edit'
import externalLink from './images/externalLink'
import importImg from './images/import'
import info from './images/info'
import termsOfUse from './images/termsOfUse'

const StyledIcon = styled.span<{ color?: keyof Theme['palette'] }>`
  display: inline-flex;

  .icon-color {
    fill: ${({ theme, color }) => (color ? theme.palette[color].main : '#B2B5B2')};
  }

  .icon-stroke {
    stroke: ${({ theme, color }) => (color ? theme.palette[color].main : '#B2B5B2')};
  }
`

const icons = {
  alert,
  bookmark,
  bookmarkFilled,
  check,
  copy,
  code,
  cross,
  delete: deleteIcon,
  edit,
  externalLink,
  importImg,
  info,
  termsOfUse,
}

export type IconType = typeof icons
export type IconTypes = keyof IconType

export type IconProps = {
  type: IconTypes
  size: 'sm' | 'md'
  color?: keyof Theme['palette']
  tooltip?: string
  className?: string
}

/**
 * The `Icon` renders an icon, it can be one already defined specified by
 * the type Iconprops or custom one using the customUrl.
 */
export const Icon = ({ type, size, color, tooltip, className }: IconProps): React.ReactElement => {
  const IconElement = (
    <StyledIcon color={color} className={className}>
      {icons[type][size]}
    </StyledIcon>
  )
  return tooltip === undefined ? (
    IconElement
  ) : (
    <Tooltip title={tooltip} placement="top">
      {IconElement}
    </Tooltip>
  )
}
