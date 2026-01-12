import React from 'react'
import styled from 'styled-components'

type SizeType = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  children: string | React.ReactNode
  size: SizeType
  withoutMargin?: boolean
  strong?: boolean
}

const StyledH1 = styled.h1<{ $withoutMargin?: boolean; $strong?: boolean }>`
  font-family: ${({ theme }) => theme.legacy?.fonts?.fontFamily || theme.typography?.fontFamily};
  font-size: ${({ theme }) => theme.legacy?.title?.size?.xl?.fontSize || '32px'};
  line-height: ${({ theme }) => theme.legacy?.title?.size?.xl?.lineHeight || '40px'};
  font-weight: ${({ $strong }) => ($strong ? 'bold' : 'normal')};
  margin: ${({ $withoutMargin }) => ($withoutMargin ? 0 : '30px')} 0;
`

const StyledH2 = styled.h2<{ $withoutMargin?: boolean; $strong?: boolean }>`
  font-family: ${({ theme }) => theme.legacy?.fonts?.fontFamily || theme.typography?.fontFamily};
  font-size: ${({ theme }) => theme.legacy?.title?.size?.lg?.fontSize || '24px'};
  line-height: ${({ theme }) => theme.legacy?.title?.size?.lg?.lineHeight || '32px'};
  font-weight: ${({ $strong }) => ($strong ? 'bold' : 'normal')};
  margin: ${({ $withoutMargin }) => ($withoutMargin ? 0 : '28px')} 0;
`

const StyledH3 = styled.h3<{ $withoutMargin?: boolean; $strong?: boolean }>`
  font-family: ${({ theme }) => theme.legacy?.fonts?.fontFamily || theme.typography?.fontFamily};
  font-size: ${({ theme }) => theme.legacy?.title?.size?.md?.fontSize || '20px'};
  line-height: ${({ theme }) => theme.legacy?.title?.size?.md?.lineHeight || '28px'};
  font-weight: ${({ $strong }) => ($strong ? 'bold' : 'normal')};
  margin: ${({ $withoutMargin }) => ($withoutMargin ? 0 : '26px')} 0;
`

const StyledH4 = styled.h4<{ $withoutMargin?: boolean; $strong?: boolean }>`
  font-family: ${({ theme }) => theme.legacy?.fonts?.fontFamily || theme.typography?.fontFamily};
  font-size: ${({ theme }) => theme.legacy?.title?.size?.sm?.fontSize || '16px'};
  line-height: ${({ theme }) => theme.legacy?.title?.size?.sm?.lineHeight || '24px'};
  font-weight: ${({ $strong }) => ($strong ? 'bold' : 'normal')};
  margin: ${({ $withoutMargin }) => ($withoutMargin ? 0 : '22px')} 0;
`

const StyledH5 = styled.h5<{ $withoutMargin?: boolean; $strong?: boolean }>`
  font-family: ${({ theme }) => theme.legacy?.fonts?.fontFamily || theme.typography?.fontFamily};
  font-size: ${({ theme }) => theme.legacy?.title?.size?.xs?.fontSize || '14px'};
  line-height: ${({ theme }) => theme.legacy?.title?.size?.xs?.lineHeight || '20px'};
  font-weight: ${({ $strong }) => ($strong ? 'bold' : 'normal')};
  margin: ${({ $withoutMargin }) => ($withoutMargin ? 0 : '18px')} 0;
`

const Title = ({ children, size, withoutMargin, strong }: Props) => {
  const transientProps = { $withoutMargin: withoutMargin, $strong: strong }
  switch (size) {
    case 'xl': {
      return <StyledH1 {...transientProps}>{children}</StyledH1>
    }
    case 'lg': {
      return <StyledH2 {...transientProps}>{children}</StyledH2>
    }
    case 'md': {
      return <StyledH3 {...transientProps}>{children}</StyledH3>
    }
    case 'sm': {
      return <StyledH4 {...transientProps}>{children}</StyledH4>
    }
    case 'xs': {
      return <StyledH5 {...transientProps}>{children}</StyledH5>
    }
  }
}

export default Title
