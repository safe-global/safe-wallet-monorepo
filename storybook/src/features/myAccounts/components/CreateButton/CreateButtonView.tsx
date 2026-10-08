import NextLink from 'next/link'
import { AppRoutes } from '@/config/routes'
import { Button } from '@/components/ui/button'
import { cn } from '@/utils/cn'

export type CreateButtonViewProps = {
  isPrimary: boolean
  buttonClassName?: string
  next?: string
}

export const CreateButtonView = ({ isPrimary, buttonClassName, next }: CreateButtonViewProps) => {
  return (
    <Button
      data-testid="create-safe-btn"
      size="action"
      variant={isPrimary ? 'default' : 'outline'}
      className={cn('max-[599px]:w-full', buttonClassName)}
      render={<NextLink href={{ pathname: AppRoutes.newSafe.create, query: { next } }} />}
    >
      Create account
    </Button>
  )
}
