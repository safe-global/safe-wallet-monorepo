import type { ReactNode } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import css from '@/components/new-safe/create/steps/StatusStep/styles.module.css'
import { Circle } from 'lucide-react'
import Identicon from '@/components/common/Identicon'

const StatusStep = ({
  isLoading,
  safeAddress,
  children,
}: {
  isLoading: boolean
  safeAddress?: string
  children: ReactNode
}) => {
  const colorClass = isLoading ? 'text-[var(--color-border-main)]' : 'text-[var(--color-primary-main)]'

  return (
    <div className={`${css.label} flex items-center gap-2`}>
      <Circle className={`${css.icon} size-4 ${colorClass} ${isLoading ? '' : 'fill-current'}`} />
      <div className={`flex items-center gap-4 ${colorClass}`}>
        <div className="shrink-0">
          {safeAddress && !isLoading ? (
            <Identicon address={safeAddress} size={32} />
          ) : (
            <Skeleton className="h-[2.3em] w-[2.3em] rounded-full" />
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

export default StatusStep
