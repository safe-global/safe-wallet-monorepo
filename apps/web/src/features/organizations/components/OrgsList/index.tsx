import AccountsNavigation from '@/features/myAccounts/components/AccountsNavigation'
import { Box, Button } from '@mui/material'
import css from './styles.module.css'

const AddOrgButton = ({ onClick }: { onClick?: () => void }) => {
  return (
    <Button disableElevation variant="contained" size="small" onClick={onClick} sx={{ height: '36px', px: 2 }}>
      <Box mt="1px">Create organization</Box>
    </Button>
  )
}

const OrgsList = () => {
  return (
    <Box className={css.container}>
      <Box className={css.myOrgs}>
        <Box className={css.orgsHeader}>
          <AccountsNavigation />
          <AddOrgButton />
        </Box>
      </Box>
    </Box>
  )
}

export default OrgsList
