import React from 'react'
import Modal from '@mui/material/Modal'
import { alpha, styled as muiStyled } from '@mui/material/styles'
import styled from 'styled-components'
import Media from 'react-media'
import { Typography } from '@mui/material'
import { Icon } from './Icon'

const StyledButton = styled.button`
  background: none;
  border: none;
  padding: 5px;
  width: 26px;
  height: 26px;

  span {
    margin-right: 0;
  }

  :focus {
    outline: none;
  }

  :hover {
    background: ${({ theme }) => theme.palette.divider};
    border-radius: 16px;
  }
`

const TitleSection = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 2px solid ${({ theme }) => theme.palette.divider};
`

const BodySection = styled.div<{
  $withoutBodyPadding?: boolean
  $smallHeight: boolean
}>`
  max-height: ${({ $smallHeight }) => ($smallHeight ? '280px' : '460px')};
  overflow-y: auto;
  padding: ${({ $withoutBodyPadding }) => ($withoutBodyPadding ? '0' : '16px 24px')};
`

const FooterSection = styled.div`
  border-top: 2px solid ${({ theme }) => theme.palette.divider};
  padding: 16px 24px;
`

const ModalPaper = styled.div`
  background: ${({ theme }) => theme.palette.background.paper};
  color: ${({ theme }) => theme.palette.text.primary};
`

export type GenericModalProps = {
  title: string | React.ReactNode
  body: React.ReactNode
  withoutBodyPadding?: boolean
  footer?: React.ReactNode
  onClose: () => void
}

const StyledModal = muiStyled(Modal, {
  shouldForwardProp: (prop) => prop !== 'smallHeight',
})<{ smallHeight: boolean }>(({ smallHeight }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflowY: 'scroll',
  background: alpha('#E8E7E6', 0.75),
  '& .MuiModal-paper': {
    position: smallHeight ? 'relative' : 'absolute',
    top: smallHeight ? 'unset' : '121px',
    minWidth: '500px',
    width: smallHeight ? '500px' : 'inherit',
    borderRadius: '8px',
    boxShadow: `0 0 0.75 0 #28363D`,
    '&:focus': {
      outline: 'none',
    },
  },
}))

const PaperWrapper = muiStyled('div', {
  shouldForwardProp: (prop) => prop !== 'smallHeight',
})<{ smallHeight: boolean }>(({ smallHeight }) => ({
  position: smallHeight ? 'relative' : 'absolute',
  top: smallHeight ? 'unset' : '121px',
  minWidth: '500px',
  width: smallHeight ? '500px' : 'inherit',
  borderRadius: '8px',
  boxShadow: `0 0 0.75 0 #28363D`,
  '&:focus': {
    outline: 'none',
  },
}))

const GenericModalComponent = ({
  body,
  footer,
  onClose,
  title,
  withoutBodyPadding,
  smallHeight,
}: GenericModalProps & { smallHeight: boolean }) => {
  return (
    <StyledModal open smallHeight={smallHeight}>
      <PaperWrapper smallHeight={smallHeight}>
        <ModalPaper>
          <TitleSection>
            <Typography variant="h6">{title}</Typography>
            <StyledButton onClick={onClose}>
              <Icon size="sm" type="cross" />
            </StyledButton>
          </TitleSection>

          <BodySection $withoutBodyPadding={withoutBodyPadding} $smallHeight={smallHeight}>
            {body}
          </BodySection>

          {footer && <FooterSection>{footer}</FooterSection>}
        </ModalPaper>
      </PaperWrapper>
    </StyledModal>
  )
}

const GenericModal = (props: GenericModalProps): React.ReactElement => (
  <Media query={{ maxHeight: 500 }}>
    {(matches: boolean) => <GenericModalComponent {...props} smallHeight={matches} />}
  </Media>
)

export default GenericModal
