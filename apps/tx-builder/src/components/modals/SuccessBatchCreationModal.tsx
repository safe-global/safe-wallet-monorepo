import Box from '@mui/material/Box'
import styled from 'styled-components'

import { ReactComponent as SuccessBatchSVG } from '../../assets/success-batch.svg'
import GenericModal from '../GenericModal'
import Text from '../Text'
import Button from '../Button'
import { Typography } from '@mui/material'
import Dot from '../Dot'

type SuccessBatchCreationModalProps = {
  count: number
  onClick: () => void
  onClose: () => void
}

const SuccessBatchCreationModal = ({ count, onClick, onClose }: SuccessBatchCreationModalProps) => {
  return (
    <GenericModal
      title="Batch Created!"
      withoutBodyPadding
      body={
        <StyledBodyWrapper display="flex" flexDirection={'column'} alignItems="center" justifyContent="center">
          {/* Image Success */}
          <SuccessBatchSVG />

          {/* Title */}
          <StyledBodyTitle>Success!</StyledBodyTitle>

          {/* Text */}
          <StyledTextWrapper>
            <StyledModalDot color="primary">
              <Text color="background">{count}</Text>
            </StyledModalDot>

            <StyledModalText>Transaction Batch in the queue.</StyledModalText>

            <Text>You can now sign and execute it.</Text>
          </StyledTextWrapper>

          {/* Button */}
          <Button onClick={onClick}>Back to Tx Creation</Button>
        </StyledBodyWrapper>
      }
      onClose={onClose}
    />
  )
}

export default SuccessBatchCreationModal

const StyledBodyWrapper = styled(Box)`
  padding: 50px;
`

const StyledBodyTitle = styled(Typography)`
  && {
    font-size: 32px;
    margin: 16px 0;
  }
`

const StyledTextWrapper = styled.div`
  position: relative;
  margin-bottom: 32px;
`

const StyledModalDot = styled(Dot)`
  position: absolute;
  height: 24px;
  width: 24px;
  min-width: 24px;
  top: -1px;
`

const StyledModalText = styled(Text)`
  text-indent: 28px;
`
