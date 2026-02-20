import * as React from 'react'

import makeBlockie from 'ethereum-blockies-base64'
import styled from 'styled-components'

export const identiconSizes = {
  xs: '10px',
  sm: '16px',
  md: '32px',
  lg: '40px',
  xl: '48px',
  xxl: '60px',
}

type Props = {
  address: string
  size: keyof typeof identiconSizes
}

const StyledImg = styled.img<{ size: keyof typeof identiconSizes }>`
  height: ${({ size }) => identiconSizes[size]};
  width: ${({ size }) => identiconSizes[size]};
  border-radius: 50%;
`

const Identicon = ({ size = 'md', address, ...rest }: Props): React.ReactElement => {
  const iconSrc = React.useMemo(() => makeBlockie(address), [address])

  return <StyledImg src={iconSrc} size={size} {...rest} />
}

export default Identicon
