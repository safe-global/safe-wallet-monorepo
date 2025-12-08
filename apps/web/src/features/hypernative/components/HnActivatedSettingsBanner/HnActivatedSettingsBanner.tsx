import { Card, Stack, SvgIcon, type SxProps } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import { hnActivatedSettingsBannerConfig } from './config'
import css from './styles.module.css'
import SafeShieldLogoFull from '@/public/images/safe-shield/safe-shield-logo.svg'

const ctaButtonStyles: SxProps = {
  border: '2px solid',
  borderColor: 'var(--color-primary-main, #121312)',
  borderRadius: '6px',
  padding: '6px 16px',
  gap: '8px',
  backgroundColor: 'transparent',
  textTransform: 'none',
  inlineSize: 'fit-content',
  '&:hover': {
    borderColor: 'var(--color-primary-main, #121312)',
    backgroundColor: 'transparent',
  },
  paddingInline: '16px',
}

const svgShieldIconStyles: SxProps = {
  width: 54,
  height: 8,
  '& .shield-img': {
    fill: 'var(--color-text-brand) !important',
    transition: 'fill 0.2s ease',
  },
  '& .shield-lines': {
    fill: '#121312 !important', // consistent between dark/light modes
    transition: 'fill 0.2s ease',
  },
  '& .shield-text': {
    fill: 'var(--color-text-primary) !important',
    transition: 'fill 0.2s ease',
  },
}

export const HnActivatedSettingsBanner = () => {
  const { title, description, statusLabel, buttonLabel, dashboardUrl } = hnActivatedSettingsBannerConfig

  return (
    <Card className={css.banner}>
      <Stack direction="row" spacing={3} sx={{ width: '100%' }}>
        <div className={css.header}>
          <div className={css.badgeContainer}>
            <SvgIcon component={SafeShieldLogoFull} inheritViewBox sx={svgShieldIconStyles} />
          </div>
          <h3 className={css.title}>{title}</h3>
        </div>

        <div className={css.content}>
          <p className={css.description}>{description}</p>
          <div className={css.statusBadge}>
            <span className={css.statusLabel}>{statusLabel}</span>
          </div>
          <ExternalLink href={dashboardUrl} mode="button" sx={ctaButtonStyles}>
            <span className={css.buttonText}>{buttonLabel}</span>
          </ExternalLink>
        </div>
      </Stack>
    </Card>
  )
}

export default HnActivatedSettingsBanner
