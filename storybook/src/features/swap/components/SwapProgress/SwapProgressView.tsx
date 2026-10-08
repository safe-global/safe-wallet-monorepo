import { Progress } from '@/components/ui/progress'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'

export type SwapProgressViewProps = {
  progressValue: number
  filledAmount: string
  tokenSymbol: string
}

export const SwapProgressView = ({ progressValue, filledAmount, tokenSymbol }: SwapProgressViewProps) => {
  const isFilled = progressValue >= 100
  const colorVar = isFilled ? 'var(--color-success-main)' : 'var(--color-warning-main)'

  return (
    <div className="flex flex-row items-center gap-2">
      <Progress
        value={progressValue}
        className={cn(
          'w-[100px] [&_[data-slot=progress-track]]:rounded-md [&_[data-slot=progress-indicator]]:rounded-md',
          isFilled
            ? '[&_[data-slot=progress-indicator]]:bg-[var(--color-success-main)]'
            : '[&_[data-slot=progress-indicator]]:bg-[var(--color-warning-main)]',
        )}
      />
      <Typography style={{ color: colorVar }}>{progressValue} %</Typography>
      <Typography>
        <span className="font-bold">
          {filledAmount} {tokenSymbol}
        </span>{' '}
        sold
      </Typography>
    </div>
  )
}
