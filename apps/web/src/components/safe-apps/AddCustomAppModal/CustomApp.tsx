import { useCallback } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Check } from 'lucide-react'

import { Typography, typographyVariants } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
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

      <h2 className={cn(typographyVariants({ variant: 'paragraph-bold' }), 'mt-4 text-[var(--color-text-primary)]')}>
        {safeApp.name}
      </h2>

      <Typography variant="paragraph-small" className="block mt-2 text-[var(--color-text-secondary)]">
        {safeApp.description}
      </Typography>

      {shareUrl ? (
        <CopyButton
          className={css.customAppCheckIcon}
          text={shareUrl}
          initialToolTipText={`Copy share URL for ${safeApp.name}`}
          onCopy={handleCopy}
        >
          <ShareIcon className="size-4 text-[var(--color-border-main)]" />
        </CopyButton>
      ) : (
        <Check className={cn(css.customAppCheckIcon, 'text-[var(--color-success-main)]')} />
      )}
    </div>
  )
}

export default CustomApp
