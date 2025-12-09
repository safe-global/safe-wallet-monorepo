import { Card, Stack, SvgIcon } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import { hnActivatedSettingsBannerConfig } from './config'
import css from './styles.module.css'
import SafeShieldColored from '@/public/images/safe-shield/safe-shield-colored.svg'

export const HnActivatedSettingsBanner = () => {
  const { title, description, statusLabel, buttonLabel, dashboardUrl } = hnActivatedSettingsBannerConfig

  return (
    <Card className={css.banner}>
      <Stack direction="row" spacing={3} sx={{ width: '100%' }}>
        <div className={css.header}>
          <div className={css.badgeContainer}>
            <SvgIcon
              component={SafeShieldColored}
              inheritViewBox
              sx={{
                width: 78,
                height: 18,
                '& rect': {
                  fill: 'var(--color-border-light)',
                },
              }}
            />
          </div>
          <h3 className={css.title}>{title}</h3>
        </div>

        <div className={css.content}>
          <p className={css.description}>{description}</p>
          <div className={css.statusBadge}>
            <span className={css.statusLabel}>{statusLabel}</span>
          </div>
          <ExternalLink href={dashboardUrl} mode="button" className={css.ctaButton}>
            <span className={css.buttonText}>{buttonLabel}</span>
          </ExternalLink>
        </div>
      </Stack>
    </Card>
  )
}

export default HnActivatedSettingsBanner
