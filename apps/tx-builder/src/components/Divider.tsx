import React from 'react'
import styled from 'styled-components'

type Props = {
  className?: string
  orientation?: 'vertical' | 'horizontal'
}

const HorizontalDivider = styled.div`
  margin: 16px -1.6rem;
  border-top: solid 1px ${({ theme }) => theme.palette.border.light};
  width: calc(100% + 3.2rem);
`

const VerticalDivider = styled.div`
  border-right: 1px solid ${({ theme }) => theme.legacy.colors.separator};
  margin: 0 5px;
  height: 100%;
`

const Divider = ({ className, orientation }: Props): React.ReactElement => {
  return orientation === 'vertical' ? (
    <VerticalDivider className={className} />
  ) : (
    <HorizontalDivider className={className} />
  )
}

export default Divider
