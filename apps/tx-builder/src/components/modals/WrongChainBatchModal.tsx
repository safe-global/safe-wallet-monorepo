import Box from '@mui/material/Box'
import styled from 'styled-components'
import GenericModal from '../GenericModal'
import { Icon } from '../Icon'
import Text from '../Text'
import Button from '../Button'

type WrongChainBatchModalProps = {
  onClick: () => void
  onClose: () => void
  fileChainId: string | undefined
}

const WrongChainBatchModal = ({ onClick, onClose, fileChainId }: WrongChainBatchModalProps) => {
  return (
    <GenericModal
      title={
        <StyledContainerTitle display="flex" alignItems="center" justifyContent="center" width="100%">
          <Icon size="md" type="alert" color="error" />
          <StyledWarningLabel>Warning</StyledWarningLabel>
        </StyledContainerTitle>
      }
      withoutBodyPadding
      body={
        <StyledModalBodyWrapper>
          <Text center>
            This batch is from another Chain
            {fileChainId ? ` (${fileChainId})` : ''}!
          </Text>
          <StyleButtonContainer display="flex" alignItems="center" justifyContent="center" maxWidth={'450px'}>
            <Button type="button" onClick={onClick}>
              Ok, I understand
            </Button>
          </StyleButtonContainer>
        </StyledModalBodyWrapper>
      }
      onClose={onClose}
    />
  )
}

export default WrongChainBatchModal

const StyledContainerTitle = styled(Box)`
  margin-left: 110px;
`

const StyledWarningLabel = styled.span`
  margin-left: 8px;
`

const StyledModalBodyWrapper = styled.div`
  padding: 24px;
  max-width: 450px;
`

const StyleButtonContainer = styled(Box)`
  margin-top: 24px;
`
