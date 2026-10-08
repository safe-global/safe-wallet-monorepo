import type { ReactNode } from 'react'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import EthHashInfo from '@/components/common/EthHashInfo'
import MinusIcon from '@/public/images/common/minus.svg'
import { maybePlural } from '@safe-global/utils/utils/formatters'

export type SettingsChangeViewProps = {
  oldOwner?: { name?: string | null; value: string }
  ownerList: ReactNode
  newOwnerList: ReactNode
  warning: ReactNode
  hasThreshold: boolean
  threshold?: number
  newSignersLength: number
}

export const SettingsChangeView = ({
  oldOwner,
  ownerList,
  newOwnerList,
  warning,
  hasThreshold,
  threshold,
  newSignersLength,
}: SettingsChangeViewProps) => {
  return (
    <>
      {oldOwner && (
        <div className="rounded-lg bg-[var(--color-warning-background)] p-4">
          <div className="text-muted-foreground mb-4 flex items-center">
            <MinusIcon className="mr-2 size-4" />
            Previous signer
          </div>
          <EthHashInfo name={oldOwner.name} address={oldOwner.value} shortAddress={false} showCopyButton hasExplorer />
        </div>
      )}

      {ownerList}
      {newOwnerList}

      {warning}

      {hasThreshold && (
        <>
          <Separator bleed="6" />

          <div>
            <Typography variant="paragraph-small">Any transaction requires the confirmation of:</Typography>
            <Typography>
              <b>{threshold}</b> out of{' '}
              <b>
                {newSignersLength} signer{maybePlural(newSignersLength)}
              </b>
            </Typography>
          </div>
        </>
      )}
      <Separator bleed="6" />
    </>
  )
}
