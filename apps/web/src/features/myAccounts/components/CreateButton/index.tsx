import { Button } from '@mui/material'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { DisableWrapper } from '@/components/wrappers/DisableWrapper'

const buttonSx = { width: ['100%', 'auto'], height: '36px', px: 2 }

const CreateButton = ({ isPrimary }: { isPrimary: boolean }) => {
  return (
    <DisableWrapper>
      <Link href={AppRoutes.newSafe.create} passHref legacyBehavior>
        <Button
          data-testid="create-safe-btn"
          disableElevation
          size="small"
          variant={isPrimary ? 'contained' : 'outlined'}
          sx={buttonSx}
          component="a"
        >
          Create account
        </Button>
      </Link>
    </DisableWrapper>
  )
}

export default CreateButton
