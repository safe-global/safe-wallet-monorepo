import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { useNewSafeNextParam } from '@/components/new-safe/getReturnUrl'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

const CreateButton = ({ isPrimary, className }: { isPrimary: boolean; className?: string }) => {
  const next = useNewSafeNextParam()
  return (
    <Button
      data-testid="create-safe-btn"
      size="action"
      variant={isPrimary ? 'default' : 'outline'}
      className={cn('max-[599px]:w-full', className)}
      render={<NextLink href={{ pathname: AppRoutes.newSafe.create, query: { next } }} />}
    >
      Create account
    </Button>
  )
}

export default CreateButton
