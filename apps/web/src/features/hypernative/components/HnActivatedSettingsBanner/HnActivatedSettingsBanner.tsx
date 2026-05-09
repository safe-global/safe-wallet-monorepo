import { Paper, Grid, Typography, SvgIcon, Box } from '@mui/material'
import ExternalLink from '@/components/common/ExternalLink'
import { hnActivatedSettingsBannerConfig } from './config'
import css from './styles.module.css'
import SafeShieldColored from '@/public/images/safe-shield/safe-shield-colored.svg'

export const HnActivatedSettingsBanner = () => {
  const { title, description, statusLabel, buttonLabel, dashboardUrl } = hnActivatedSettingsBannerConfig

  return (
    <Paper sx={{ padding: 4 }}>
      <Grid container spacing={3}>
        <Grid item lg={4} xs={12}>
          <Box display="flex" flexDirection="column" gap={1}>
            <div className={css.badgeContainer}>
              <SvgIcon
                component={SafeShieldColored}
                inheritViewBox
                sx={{
                  width: 78,
                  height: 18,
                  '& rect': {
                    fill: 'var(--color-background-main)',
                  },
                  '& .safeShieldText': {
                    fill: 'var(--color-logo-main)',
                  },
                }}
              />
            </div>
            <Typography variant="h4" fontWeight="bold">
              {title}
            </Typography>
          </Box>
        </Grid>

        <Grid item xs>
          <Typography mb={2}>{description}</Typography>
          <Box display="flex" flexDirection="column" gap={2}>
            <div className={css.statusBadge}>
              <span className={css.statusLabel}>{statusLabel}</span>
            </div>
            <ExternalLink href={dashboardUrl} mode="button" className={css.ctaButton}>
              <span className={css.buttonText}>{buttonLabel}</span>
            </ExternalLink>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  )
}
