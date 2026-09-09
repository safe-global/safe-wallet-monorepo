import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import { useDarkMode } from '@/hooks/useDarkMode'
import { trackSafeProBannerClick, type SafeProBannerLocation } from '../../utils/trackSafeProBannerClick'
import css from './styles.module.css'

const SafeProAnnouncement = ({ location, onDismiss }: { location: SafeProBannerLocation; onDismiss?: () => void }) => {
  const isDarkMode = useDarkMode()

  return (
    <div className="p-1">
      <div className="relative aspect-[1141/268] w-full overflow-hidden rounded-t-[calc(2rem_-_4px)]">
        <Image
          src={`/images/safe-pro/pro-announcement-hero${isDarkMode ? '-dark' : ''}.jpg`}
          alt="A Workspace from Safe Pro, with its accounts, members and transactions"
          fill
          className="object-cover object-top"
        />
      </div>

      <div className="flex flex-col items-center gap-6 px-8 py-6">
        <div className="flex flex-col items-center gap-3">
          <Typography variant="h4" align="center">
            Your Workspace moves to <span className={css.highlight}>Safe Pro</span> on Oct 6, 2026
          </Typography>

          <Typography variant="paragraph" color="muted" align="center">
            Safe Pro will add advanced security checks, sponsored transactions and policies. Your Safe accounts remain
            available outside of the Workspace. Starting October 6, you can claim up to two months of Safe Pro for free
            for this Workspace.
          </Typography>
        </div>

        <div className="flex shrink-0 gap-3">
          {onDismiss && (
            <Button size="lg" variant="secondary" onClick={onDismiss}>
              Got it
            </Button>
          )}

          <Button
            size="lg"
            render={
              <a
                onClick={() => trackSafeProBannerClick(location)}
                href={SAFE_PRO_ANNOUNCEMENT_URL}
                target="_blank"
                rel="noopener noreferrer"
              />
            }
          >
            Learn more
            <ArrowUpRight data-icon="inline-end" className={cn('text-green-400', css.arrow)} />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SafeProAnnouncement
