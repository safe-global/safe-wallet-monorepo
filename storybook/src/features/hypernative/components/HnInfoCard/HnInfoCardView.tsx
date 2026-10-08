import { type ReactElement, type ReactNode } from 'react'
import { Typography } from '@/components/ui/typography'
import SafeShieldLogo from '@/public/images/safe-shield/safe-shield-logo-no-text.svg'
import InfoIcon from '@/public/images/notifications/info.svg'

export type HnInfoCardViewProps = {
  renderTooltip: (props: { title: string; children: ReactNode }) => ReactNode
}

export const HnInfoCardView = ({ renderTooltip }: HnInfoCardViewProps): ReactElement => {
  return (
    <div className="flex flex-row items-center justify-between px-3 pt-3 pb-4">
      <div className="flex flex-row items-center gap-2">
        <SafeShieldLogo className="size-4 [&_.shield-img]:fill-[var(--color-border-light)]" />
        <Typography variant="paragraph-small" className="text-[var(--color-primary-light)]">
          Hypernative Guardian is active
        </Typography>
      </div>
      {renderTooltip({
        title: 'Hypernative Guardian is actively monitoring this transaction.',
        children: <InfoIcon className="size-4 text-[var(--color-border-main)]" />,
      })}
    </div>
  )
}
