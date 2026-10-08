import { Card, CardContent } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'

import { Divider } from '@/components/tx/ColorCodedTxAccordion/ColorCodedTxAccordionView'

import NestedTransactionIcon from '@/public/images/transactions/nestedTx.svg'
import type { ComponentProps, ReactElement, ReactNode } from 'react'
import ExternalLink from '@/components/common/ExternalLink'
import Track from '@/components/common/Track'
import Link from 'next/link'
import { MODALS_EVENTS } from '@/services/analytics/events/modals'

export type NestedTransactionViewProps = {
  decoded?: { methodCall: ReactNode; methodDetails: ReactNode }
  openHref?: ComponentProps<typeof Link>['href']
  children: ReactElement
}

export const NestedTransactionView = ({ decoded, openHref, children }: NestedTransactionViewProps) => {
  return (
    <div className="flex flex-col gap-4">
      {decoded && (
        <>
          {decoded.methodCall}
          {decoded.methodDetails}
          <Divider />
        </>
      )}

      <Card variant="outlined" surface="sunken" size="none" radius="lg">
        <div className="border-border-light flex items-center gap-4 border-b p-4">
          <NestedTransactionIcon className="size-4" />
          <Typography variant="h4" className="grow">
            Nested transaction
          </Typography>
          {openHref && (
            <Track {...MODALS_EVENTS.OPEN_NESTED_TX}>
              <Link href={openHref} passHref legacyBehavior>
                <ExternalLink className="text-muted-foreground">
                  <Typography variant="paragraph-small-bold">Open</Typography>
                </ExternalLink>
              </Link>
            </Track>
          )}
        </div>
        <CardContent>
          <div className="flex flex-col gap-8 p-4">{children}</div>
        </CardContent>
      </Card>
    </div>
  )
}
