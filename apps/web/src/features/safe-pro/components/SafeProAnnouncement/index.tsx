import type { ComponentType, ReactNode } from 'react'
import Image from 'next/image'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import { SAFE_PRO_ANNOUNCEMENT_URL } from '@/config/constants'
import css from './styles.module.css'

/** Lets the dialog wrap the heading and body in DialogTitle/DialogDescription for its a11y wiring. */
export type AnnouncementWrapper = ComponentType<{ children: ReactNode }>

const Passthrough: AnnouncementWrapper = ({ children }) => <>{children}</>

const SafeProAnnouncement = ({
  TitleWrapper = Passthrough,
  DescriptionWrapper = Passthrough,
}: {
  TitleWrapper?: AnnouncementWrapper
  DescriptionWrapper?: AnnouncementWrapper
}) => (
  // 4px inset lives here rather than on the surface, which owns padding/radius via its props.
  // The hero's top corners are the surface's own radius less that inset.
  <div className="p-1">
    <div className="relative aspect-[1058/369] w-full overflow-hidden rounded-t-[calc(var(--radius-xl)-4px)]">
      <Image
        src="/images/safe-pro/pro-announcement-hero.jpg"
        alt="A Workspace on the Pro plan, with its accounts, members and transactions"
        fill
        className="object-cover"
      />
    </div>

    <div className="flex flex-col items-center gap-8 px-8 pt-9 pb-4">
      <div className="flex flex-col items-center gap-3">
        <TitleWrapper>
          <Typography variant="h3" align="center">
            Your Workspace moves to <span className={css.highlight}>Pro</span> on Oct 1, 2026
          </Typography>
        </TitleWrapper>

        <DescriptionWrapper>
          <Typography variant="paragraph-large" color="muted" align="center" className="max-w-[590px]">
            Pro adds policies, advanced security checks and sponsored transactions. Your Safe accounts stay available
            outside the Workspace.
          </Typography>
        </DescriptionWrapper>
      </div>

      <Button
        size="lg"
        render={<a href={SAFE_PRO_ANNOUNCEMENT_URL} target="_blank" rel="noopener noreferrer" />}
        className="shrink-0"
      >
        Learn more
        <ArrowUpRight data-icon="inline-end" className={css.ctaArrow} />
      </Button>
    </div>
  </div>
)

export default SafeProAnnouncement
