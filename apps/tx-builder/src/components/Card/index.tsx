import React from 'react'
import styled from 'styled-components'
import { alpha } from '@mui/material/styles'

const StyledCard = styled.div`
  box-shadow: 1px 2px 10px 0 ${alpha('#28363D', 0.18)};
  border-radius: 8px;
  padding: 24px;
  background-color: ${({ theme }) => theme.palette.common.white};
  position: relative;
`

const Disabled = styled.div`
  opacity: 0.5;
  position: absolute;
  height: 100%;
  width: 100%;
  background-color: ${({ theme }) => theme.palette.common.white};
  z-index: 1;
  top: 0;
  left: 0;
`

type Props = {
  className?: string
  disabled?: boolean
} & React.HTMLAttributes<HTMLDivElement>

const Card: React.FC<Props> = ({ className, children, disabled, ...rest }): React.ReactElement => (
  <StyledCard className={className} {...rest}>
    {disabled && <Disabled />}
    {children}
  </StyledCard>
)

export default Card
