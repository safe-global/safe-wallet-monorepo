import React from 'react'
import MuiAlert from '@mui/lab/Alert'
import MuiAlertTitle from '@mui/lab/AlertTitle'
import styled from 'styled-components'
import { useTransactionLibrary } from '../store'

const ChecksumWarning = () => {
  const { hasChecksumWarning, setHasChecksumWarning } = useTransactionLibrary()

  if (!hasChecksumWarning) {
    return null
  }

  return (
    <ChecksumWrapper>
      <MuiAlert severity="warning" onClose={() => setHasChecksumWarning(false)}>
        <MuiAlertTitle>This batch contains some changed properties since you saved or downloaded it</MuiAlertTitle>
      </MuiAlert>
    </ChecksumWrapper>
  )
}

const ChecksumWrapper = styled.div`
  position: fixed;
  width: 100%;
  z-index: 10;
  background-color: transparent;
  height: 70px;
`

export default ChecksumWarning
