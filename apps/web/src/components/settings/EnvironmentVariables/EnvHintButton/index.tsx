import { useRouter } from 'next/router'
import { type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { AppRoutes } from '@/config/routes'
import { useAppSelector } from '@/store'
import { isEnvInitialState } from '@/store/settingsSlice'
import useChainId from '@/hooks/useChainId'
import { cn } from '@/utils/cn'

type EnvHintButtonProps = {
  chainId?: string
  className?: string
}

const EnvHintButton = ({ chainId: chainIdProp, className }: EnvHintButtonProps = {}) => {
  const router = useRouter()
  const fallbackChainId = useChainId()
  const chainId = chainIdProp ?? fallbackChainId
  const isInitialState = useAppSelector((state) => isEnvInitialState(state, chainId))

  if (isInitialState) {
    return null
  }

  const navigate = () => {
    router.push({ pathname: AppRoutes.settings.environmentVariables, query: router.query })
  }

  const handlePointer = (e: MouseEvent | PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    navigate()
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.stopPropagation()
    e.preventDefault()
    navigate()
  }

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div
            role="button"
            tabIndex={0}
            aria-label="Default environment has been changed"
            onClick={handlePointer}
            onPointerDown={handlePointer}
            onKeyDown={handleKeyDown}
            className={cn(
              'inline-flex size-6 shrink-0 cursor-pointer items-center justify-center rounded outline-none transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-ring/50',
              className,
            )}
            style={{ backgroundColor: 'var(--color-warning-background)', color: 'var(--color-warning-main)' }}
          />
        }
      >
        <TriangleAlert className="size-3.5" />
      </TooltipTrigger>
      <TooltipContent>Default environment has been changed</TooltipContent>
    </Tooltip>
  )
}

export default EnvHintButton
