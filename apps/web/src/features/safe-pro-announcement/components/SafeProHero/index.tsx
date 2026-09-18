import Image from 'next/image'
import { cn } from '@/utils/cn'

const ALT = 'A Workspace from Safe Pro, with its accounts, members and transactions'

// `tall` crops to the left third for the narrow confirmation dialog.
const SafeProHero = ({ variant = 'wide' }: { variant?: 'wide' | 'tall' }) => (
  <div
    className={cn(
      'relative w-full overflow-hidden',
      variant === 'tall'
        ? 'aspect-[568/369] rounded-t-[calc(var(--radius-xl)-4px)] *:object-left'
        : 'aspect-[1141/268] rounded-t-[calc(2rem-4px)] *:object-top',
    )}
  >
    <Image src="/images/safe-pro/pro-announcement-hero.jpg" alt={ALT} fill className="object-cover dark:hidden" />
    <Image
      src="/images/safe-pro/pro-announcement-hero-dark.svg"
      alt={ALT}
      fill
      unoptimized
      className="hidden object-cover dark:block"
    />
  </div>
)

export default SafeProHero
