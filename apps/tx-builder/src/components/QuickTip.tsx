import MuiAlert from '@mui/lab/Alert'
import MuiAlertTitle from '@mui/lab/AlertTitle'
import styled from 'styled-components'
import { Icon } from './Icon'

type QuickTipProps = {
  onClose: () => void
}

const QuickTip = ({ onClose }: QuickTipProps) => {
  return (
    <StyledAlert severity="success" onClose={onClose} icon={false}>
      <StyledTitle>Quick Tip</StyledTitle>
      You can save your batches in your transaction library{' '}
      <StyledIcon size="sm" type="bookmark" color="primary" aria-label="Save to Library" /> (local browser storage) or{' '}
      <StyledIcon size="sm" type="importImg" color="primary" aria-label="Download" /> download the .json file to use
      them later.
    </StyledAlert>
  )
}

const StyledAlert = styled(MuiAlert)`
  && {
    font-size: 14px;
    padding: 24px;
    background: ${({ theme }) => theme.palette.secondary.background};
    color: ${({ theme }) => theme.palette.text.primary};
    border-radius: 8px;

    .MuiAlert-action {
      align-items: flex-start;
    }
  }
`

const StyledTitle = styled(MuiAlertTitle)`
  && {
    font-size: 14px;
    font-weight: bold;
  }
`

const StyledIcon = styled(Icon)`
  position: relative;
  top: 3px;
`

export default QuickTip
