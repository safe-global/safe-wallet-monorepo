import ExternalLink from '@/components/common/ExternalLink'
import { Typography } from '@/components/ui/typography'
import { hnActivatedSettingsBannerConfig } from './config'
import css from './styles.module.css'
import SafeShieldColored from '@/public/images/safe-shield/safe-shield-colored.svg'

export const HnActivatedSettingsBanner = () => {
  const { title, description, statusLabel, buttonLabel, dashboardUrl } = hnActivatedSettingsBannerConfig

  return (
    <div className="rounded-xl bg-[var(--color-background-paper)] p-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <div className="flex flex-col gap-2">
            <div className={css.badgeContainer}>
              <SafeShieldColored className="h-[18px] w-[78px] [&_.safeShieldText]:fill-[var(--color-logo-main)] [&_rect]:fill-[var(--color-background-main)]" />
            </div>
            <Typography variant="h4">{title}</Typography>
          </div>
        </div>

        <div className="lg:col-span-8">
          <Typography className="mb-4">{description}</Typography>
          <div className="flex flex-col gap-4">
            <div className={css.statusBadge}>
              <span className={css.statusLabel}>{statusLabel}</span>
            </div>
            <ExternalLink href={dashboardUrl} mode="button" className={css.ctaButton}>
              <span className={css.buttonText}>{buttonLabel}</span>
            </ExternalLink>
          </div>
        </div>
      </div>
    </div>
  )
}
