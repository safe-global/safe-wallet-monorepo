import type { ReactElement, ReactNode } from 'react'
import type { SafeApp as SafeAppData } from '@safe-global/store/gateway/AUTO_GENERATED/safe-apps'
import { Check } from 'lucide-react'
import { Typography, typographyVariants } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import ShareIcon from '@/public/images/common/share.svg'
import SafeAppIconCard from '@/components/safe-apps/SafeAppIconCard'
import css from './styles.module.css'

export type CopyButtonSlotProps = {
  className: string
  initialToolTipText: string
  children: ReactNode
}

export type CustomAppViewProps = {
  safeApp: SafeAppData
  shareUrl: string
  renderCopyButton: (props: CopyButtonSlotProps) => ReactNode
}

export function CustomAppView({ safeApp, shareUrl, renderCopyButton }: CustomAppViewProps): ReactElement {
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
        renderCopyButton({
          className: css.customAppCheckIcon,
          initialToolTipText: `Copy share URL for ${safeApp.name}`,
          children: <ShareIcon className="size-4 text-[var(--color-border-main)]" />,
        })
      ) : (
        <Check className={cn(css.customAppCheckIcon, 'text-[var(--color-success-main)]')} />
      )}
    </div>
  )
}
