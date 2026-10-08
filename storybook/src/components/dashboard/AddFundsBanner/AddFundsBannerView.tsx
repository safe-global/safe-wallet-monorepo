import type { ReactElement, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Typography } from '@/components/ui/typography'
import FiatIcon from '@/public/images/common/fiat2.svg'
import CopyIcon from '@/public/images/common/copy.svg'

export type AddFundsBannerViewProps = {
  renderCopyTooltip: (children: ReactNode) => ReactNode
}

export function AddFundsBannerView({ renderCopyTooltip }: AddFundsBannerViewProps): ReactElement {
  return (
    <div className="flex flex-col items-start gap-4 rounded-3xl bg-[var(--color-info-light)] p-4 md:flex-row md:items-center">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-[var(--color-background-paper)]">
        <FiatIcon className="size-5" />
      </div>
      <div>
        <Typography variant="paragraph-bold" className="text-[var(--color-static-main)]">
          Add funds to get started
        </Typography>
        <Typography variant="paragraph-small" className="block text-[var(--color-primary-light)]">
          Onramp crypto or send tokens directly to your address from a different wallet.{' '}
        </Typography>
      </div>
      <div className="md:ml-auto">
        {renderCopyTooltip(
          <Button size="sm" variant="surface">
            <CopyIcon className="size-5" />
            Copy address
          </Button>,
        )}
      </div>
    </div>
  )
}
