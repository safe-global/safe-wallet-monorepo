import { Button } from '@mui/material'
import Link from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { cn } from '@/utils/cn'

const buttonSx = { width: ['100%', 'auto'], minHeight: '36px', px: 2 }

const CreateButton = ({ isPrimary, className }: { isPrimary: boolean; className?: string }) => {
  const next = useNewSafeNextParam()
  return (
    <Link href={{ pathname: AppRoutes.newSafe.create, query: { next } }} passHref legacyBehavior>
      <Button
        data-testid="create-safe-btn"
        disableElevation
        size="small"
        className={cn('rounded-lg font-medium', className)}
        variant={isPrimary ? 'contained' : 'outlined'}
        sx={buttonSx}
        component="a"
      >
        Create account
      </Button>
    </Link>
  )
}

export default CreateButton
