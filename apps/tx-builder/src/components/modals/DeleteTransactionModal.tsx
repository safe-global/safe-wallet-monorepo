import Box from '@mui/material/Box'
import styled from 'styled-components'
import GenericModal from '../GenericModal'
import Text from '../Text'
import Button from '../Button'
import Dot from '../Dot'

type DeleteTransactionModalProps = {
  txIndex: number
  txDescription: string
  onClick: () => void
  onClose: () => void
}

const DeleteTransactionModal = ({ txIndex, txDescription, onClick, onClose }: DeleteTransactionModalProps) => {
  const positionLabel = txIndex + 1
  return (
    <GenericModal
      title={'Delete from batch?'}
      withoutBodyPadding
      body={
        <StyledModalBodyWrapper>
          <StyledModalDot color="primary">
            <Text color="background">{positionLabel}</Text>
          </StyledModalDot>

          <StyledModalText>{`${txDescription} will be permanently deleted from the batch`}</StyledModalText>
          <StyledModalButtonsWrapper display="flex" alignItems="center" justifyContent="center" maxWidth={'450px'}>
            <Button variant="bordered" onClick={onClose}>
              Back
            </Button>
            <Button style={{ marginLeft: 16 }} color="error" onClick={onClick}>
              Yes, delete
            </Button>
          </StyledModalButtonsWrapper>
        </StyledModalBodyWrapper>
      }
      onClose={onClose}
    />
  )
}

export default DeleteTransactionModal

const StyledModalBodyWrapper = styled.div`
  position: relative;
  padding: 24px;
  max-width: 450px;
`

const StyledModalDot = styled(Dot)`
  height: 24px;
  width: 24px;
  min-width: 24px;

  position: absolute;
  top: 22px;
`

const StyledModalText = styled(Text)`
  text-indent: 30px;
`

const StyledModalButtonsWrapper = styled(Box)`
  margin-top: 24px;
`
