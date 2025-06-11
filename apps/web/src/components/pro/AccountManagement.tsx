import React from 'react'
import { Box, Alert, AlertTitle } from '@mui/material'
import css from './styles.module.css'

interface AccountManagementProps {
  onGoBack: () => void
}

const AccountManagement: React.FC<AccountManagementProps> = ({ onGoBack }) => {
  return (
    <Box className={css.accountManagementContainer}>
      <Alert severity="info" className={css.accountManagementAlert}>
        <AlertTitle>Feature not implemented</AlertTitle>
      </Alert>
    </Box>
  )
}

export default AccountManagement
