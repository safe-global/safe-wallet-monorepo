import React from 'react'
import styled from 'styled-components'
import { Icon } from '../../Icon'
import { ExplorerInfo } from '../../ETHHashInfo'

const StyledLink = styled.a`
  background: none;
  color: inherit;
  border: none;
  padding: 0;
  font: inherit;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s ease-in-out;
  outline-color: transparent;
  height: 24px;
  width: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  :hover {
    background-color: #f0efee;
  }
`

type Props = {
  className?: string
  explorerUrl: ExplorerInfo
}

const ExplorerButton = ({ className, explorerUrl }: Props): React.ReactElement => {
  const { url, alt } = explorerUrl()
  const onClick = (event: React.MouseEvent<HTMLAnchorElement>): void => {
    event.stopPropagation()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>): void => {
    // prevents event from bubbling when `Enter` is pressed
    if (event.keyCode === 13) {
      event.stopPropagation()
    }
  }

  return (
    <StyledLink
      className={className}
      aria-label="Show details on Etherscan"
      rel="noopener noreferrer"
      onClick={onClick}
      href={url}
      target="_blank"
      onKeyDown={onKeyDown}
    >
      <Icon size="sm" type="externalLink" tooltip={alt} />
    </StyledLink>
  )
}

export default ExplorerButton
