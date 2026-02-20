import React from 'react'
import MuiAlert from '@mui/lab/Alert'
import MuiAlertTitle from '@mui/lab/AlertTitle'
import styled from 'styled-components'
import { useTransactionLibrary } from '../store'

const ErrorAlert = () => {
  const { errorMessage, setErrorMessage } = useTransactionLibrary()

  if (!errorMessage) {
    return null
  }

  return (
    <ErrorAlertContainer>
      <MuiAlert severity="error" onClose={() => setErrorMessage('')}>
        <MuiAlertTitle>{errorMessage}</MuiAlertTitle>
      </MuiAlert>
    </ErrorAlertContainer>
  )
}

const ErrorAlertContainer = styled.div`
  position: fixed;
  width: 100%;
  z-index: 10;
  background-color: transparent;
  height: 70px;
`

export default ErrorAlert
