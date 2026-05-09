import { useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Typography, SvgIcon } from '@mui/material'
import CheckIcon from '@mui/icons-material/Check'

import { SAFE_APPS_EVENTS, trackSafeAppEvent } from '@/services/analytics'
import CopyButton from '@/components/common/CopyButton'
import ShareIcon from '@/public/images/common/share.svg'
import css from './styles.module.css'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'

type CustomAppProps = {
  safeApp: SafeAppData
  shareUrl: string
}

const CustomApp = ({ safeApp, shareUrl }: CustomAppProps) => {
  const handleCopy = useCallback(() => {
    trackSafeAppEvent(SAFE_APPS_EVENTS.COPY_SHARE_URL, safeApp.name)
  }, [safeApp])

  return (
    <div className={css.customAppContainer}>
      <SafeAppIconCard src={safeApp.iconUrl} alt={safeApp.name} width={48} height={48} />

      <Typography component="h2" mt={2} color="text.primary" fontWeight={700}>
        {safeApp.name}
      </Typography>

      <Typography variant="body2" mt={1} color="text.secondary">
        {safeApp.description}
      </Typography>

      {shareUrl ? (
        <CopyButton
          className={css.customAppCheckIcon}
          text={shareUrl}
          initialToolTipText={`Copy share URL for ${safeApp.name}`}
          onCopy={handleCopy}
        >
          <SvgIcon component={ShareIcon} inheritViewBox color="border" fontSize="small" />
        </CopyButton>
      ) : (
        <CheckIcon color="success" className={css.customAppCheckIcon} />
      )}
    </div>
  )
}

export default CustomApp
