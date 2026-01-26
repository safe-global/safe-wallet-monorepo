import Box from '@mui/material/Box'

import styled from 'styled-components'
import { Batch } from '../../typings/models'
import GenericModal from '../GenericModal'
import Text from '../Text'
import Button from '../Button'
import Dot from '../Dot'

type DeleteBatchFromLibraryProps = {
  batch: Batch
  onClick: (batch: Batch) => void
  onClose: () => void
}

const DeleteBatchFromLibrary = ({ batch, onClick, onClose }: DeleteBatchFromLibraryProps) => {
  return (
    <GenericModal
      title="Delete batch from the library?"
      withoutBodyPadding
      body={
        <StyledModalBodyWrapper>
          <StyledModalDot color="primary">
            <Text color="background">{batch.transactions.length}</Text>
          </StyledModalDot>

          <StyledModalText>{`${batch.name} batch will be permanently deleted`}</StyledModalText>
          <StyledModalButtonsWrapper display="flex" alignItems="center" justifyContent="center" maxWidth={'450px'}>
            <Button variant="bordered" onClick={onClose}>
              Back
            </Button>
            <Button style={{ marginLeft: 16 }} color="error" onClick={() => onClick(batch)}>
              Yes, delete
            </Button>
          </StyledModalButtonsWrapper>
        </StyledModalBodyWrapper>
      }
      onClose={onClose}
    />
  )
}

export default DeleteBatchFromLibrary

const StyledModalBodyWrapper = styled.div`
  position: relative;
  padding: 24px;
  max-width: 450px;
`

const StyledModalDot = styled(Dot)`
  && {
    height: 24px;
    width: 24px;
    min-width: 24px;

    position: absolute;
    top: 22px;
  }
`

const StyledModalText = styled(Text)`
  text-indent: 30px;
`

const StyledModalButtonsWrapper = styled(Box)`
  margin-top: 24px;
`
