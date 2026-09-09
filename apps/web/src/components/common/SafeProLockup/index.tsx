import SafeMark from '@/public/images/safe-pro/safe-mark.svg'
import SafeWordmark from '@/public/images/safe-pro/safe-wordmark.svg'
import ProChip from '@/public/images/safe-pro/pro-chip.svg'
import { cn } from '@/utils/cn'

// Sized in em so the parent's font size scales the whole lockup; 1rem gives the 18/36/24px Figma sidebar lockup.
const SafeProLockup = ({ className }: { className?: string }) => (
  <span
    role="img"
    aria-label="Safe Pro"
    className={cn('inline-flex items-center gap-[0.375em] text-foreground', className)}
  >
    <span className="block h-[1.0625em] w-[1.125em]">
      <SafeMark className="size-full" />
    </span>
    <span className="block h-[0.875em] w-[2.25em]">
      <SafeWordmark className="size-full" />
    </span>
    <span className="block h-[1em] w-[1.5em]">
      <ProChip className="size-full" />
    </span>
  </span>
)

export default SafeProLockup
