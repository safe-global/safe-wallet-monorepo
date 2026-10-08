import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import Image from 'next/image'
import css from './styles.module.css'
import { dashboardBannerConfig } from './config'

export type HnDashboardBannerViewProps = {
  onBannerClick: () => void
}

export const HnDashboardBannerView = ({ onBannerClick }: HnDashboardBannerViewProps) => {
  const { title, description, ctaLabel, badgeSrc, badgeAlt, tagLabel } = dashboardBannerConfig

  return (
    <div className={`cursor-pointer ${css.banner}`} onClick={onBannerClick} role="button">
      <div className={css.tag}>
        <Typography variant="paragraph-small" className={css.tagText}>
          {tagLabel}
        </Typography>
      </div>

      <div className={css.content}>
        <div className={css.badgeContainer}>
          <Image src={badgeSrc} alt={badgeAlt} width={54} height={54} className={css.badge} />
        </div>

        <div className={css.textContent}>
          <Typography variant="h4" className={css.title}>
            {title}
          </Typography>

          <Typography variant="paragraph-small" className={css.description}>
            {description}
          </Typography>

          <Button
            variant="outline"
            size="sm"
            // eslint-disable-next-line no-restricted-syntax -- faithful css-module port, pixel-identical; bespoke values have no variant
            className="mt-[var(--space-3)]! mb-[var(--space-1)]! border-[#12ff80]! text-[#12ff80]! rounded-[6px] py-[6px] px-[var(--space-1)] font-bold text-[14px] leading-[24px] tracking-[0.4px] normal-case self-start hover:border-[#12ff80]! hover:bg-[rgba(18,255,128,0.1)]! hover:max-w-full"
          >
            {ctaLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
