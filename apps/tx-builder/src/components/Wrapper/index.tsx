import React from 'react'
import styled from 'styled-components'

function Wrapper({ children, centered }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <StyledWrapper $centered={centered}>
      <section>{children}</section>
    </StyledWrapper>
  )
}

const StyledWrapper = styled.main<{ $centered?: boolean }>`
  width: 100%;
  min-height: 100%;
  display: flex;
  background: ${({ theme }) => theme.palette.background.main};
  color: ${({ theme }) => theme.palette.text.primary};

  > section {
    width: 100%;
    padding: 120px 4rem 48px;
    box-sizing: border-box;
    margin: 0 auto;
    max-width: ${({ $centered }) => ($centered ? '1000px' : '1500px')};
  }
`

export default Wrapper
