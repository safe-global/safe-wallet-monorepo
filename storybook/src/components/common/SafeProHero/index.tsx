import Image from 'next/image'
import { cn } from '@/utils/cn'

const ALT = 'A Workspace from Safe Pro, with its accounts, members and transactions'

const VARIANTS = {
  wide: 'aspect-[1141/268] rounded-t-[calc(2rem-4px)] *:object-top',
  // Crops to the left third for a narrow dialog.
  tall: 'aspect-[568/369] rounded-t-[calc(var(--radius-xl)-4px)] *:object-left',
  // The top-left 632x244 of the 1056-wide artwork at 1:1, so the lockup reads large in the confirmation dialogs.
  compact: 'aspect-[632/244] rounded-t-[calc(var(--radius-xl)-4px)] *:object-left-top *:origin-top-left *:scale-151',
}

const SafeProHero = ({ variant = 'wide' }: { variant?: keyof typeof VARIANTS }) => (
  <div className={cn('relative w-full overflow-hidden', VARIANTS[variant])}>
    <Image src="/images/safe-pro/pro-announcement-hero.jpg" alt={ALT} fill className="object-cover dark:hidden" />
    <Image
      src="/images/safe-pro/pro-announcement-hero-dark.jpg"
      alt={ALT}
      fill
      className="hidden object-cover dark:block"
    />
  </div>
)

export default SafeProHero
