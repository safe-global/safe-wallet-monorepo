import type { ReactElement, ReactNode } from 'react'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'

export type SafeInfoViewProps = {
  safeAddress: string
  name?: string
  prefix?: string
  safeIcon: ReactNode
  renderCopyAddressButton: (children: ReactNode) => ReactNode
}

export const SafeInfoView = ({
  safeAddress,
  name,
  prefix,
  safeIcon,
  renderCopyAddressButton,
}: SafeInfoViewProps): ReactElement => {
  return (
    <div data-testid="tx-flow-safe-info" className="flex flex-row items-center gap-2">
      <div data-testid="safe-icon">{safeAddress ? safeIcon : <Skeleton className="size-8 rounded-full" />}</div>

      <div className="overflow-hidden">
        {safeAddress ? (
          <>
            {name && (
              <Typography variant="paragraph-small-bold" className="overflow-hidden text-ellipsis whitespace-nowrap">
                {name}
              </Typography>
            )}
            <Typography variant="paragraph-small">
              {renderCopyAddressButton(
                <>
                  {prefix && <b>{prefix}:</b>}
                  {shortenAddress(safeAddress)}
                </>,
              )}
            </Typography>
          </>
        ) : (
          <Typography as="div" variant="paragraph-small">
            <Skeleton className="h-4 w-[86px]" />
            <Skeleton className="h-4 w-[120px]" />
          </Typography>
        )}
      </div>
    </div>
  )
}
