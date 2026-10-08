import React, { type ReactElement } from 'react'
import type { LinkProps } from 'next/link'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import { WidgetCard } from '@/components/dashboard/styled'
import css from './styles.module.css'
import PositionsHeader from '@views/features/positions/components/PositionsHeader'
import { PositionGroup } from '@views/features/positions/components/PositionGroup'

export type PositionsWidgetViewProps = {
  isLoading: boolean
  protocols: Protocol[]
  positionsFiatTotal?: number
  isPortfolioEndpointEnabled: boolean
  viewAllUrl: LinkProps['href']
  viewAllWrapper: (children: ReactElement) => ReactElement
  onProtocolExpand: (protocol: Protocol) => void
}

export const PositionsWidgetView = ({
  isLoading,
  protocols,
  positionsFiatTotal,
  isPortfolioEndpointEnabled,
  viewAllUrl,
  viewAllWrapper,
  onProtocolExpand,
}: PositionsWidgetViewProps) => {
  if (isLoading) {
    return (
      <WidgetCard title="Top positions" testId="positions-widget">
        <div>
          {Array(2)
            .fill(0)
            .map((_, index) => (
              <Accordion key={index}>
                <AccordionItem value={`skeleton-${index}`} className="border-b-0">
                  <AccordionTrigger className={cn(css.position, 'overflow-x-auto px-3')}>
                    <div className="flex w-full items-center gap-4">
                      <Skeleton className="size-10 rounded-md" />
                      <div className="flex-1">
                        <Skeleton className="h-6 w-[100px]" />
                        <Skeleton className="h-5 w-[60px]" />
                      </div>
                      <Skeleton className="h-6 w-[50px]" />
                    </div>
                  </AccordionTrigger>

                  <AccordionContent className="px-4 pb-4 pt-0">
                    {Array(2)
                      .fill(0)
                      .map((_, posIndex) => (
                        <div key={posIndex}>
                          <Skeleton className={cn('h-5 w-[80px]', posIndex !== 0 ? 'mb-2 mt-4' : 'mb-2')} />

                          <Separator className="opacity-50" />

                          <div className="flex items-center gap-4 py-2">
                            <Skeleton className="size-6 rounded-md" />
                            <div className="flex-1">
                              <Skeleton className="h-6 w-[60px]" />
                              <Skeleton className="h-5 w-[40px]" />
                            </div>
                            <Skeleton className="ml-auto h-6 w-[40px]" />
                          </div>
                        </div>
                      ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ))}
        </div>
      </WidgetCard>
    )
  }

  return (
    <WidgetCard
      title="Top positions"
      viewAllUrl={protocols.length > 0 ? viewAllUrl : undefined}
      viewAllWrapper={viewAllWrapper}
      testId="positions-widget"
    >
      {!isPortfolioEndpointEnabled && (
        <div className="mb-2 px-3">
          <Typography variant="paragraph-mini" className="text-[var(--color-text-secondary)]">
            Position balances are not included in the total asset value.
          </Typography>
        </div>
      )}

      <div>
        {protocols.map((protocol, protocolIndex) => {
          const isLast = protocolIndex === protocols.length - 1

          return (
            <Accordion
              key={protocol.protocol}
              onValueChange={(value) => {
                if (value.length > 0) onProtocolExpand(protocol)
              }}
            >
              <AccordionItem value={protocol.protocol} className="border-b-0">
                <AccordionTrigger
                  className={cn(
                    css.position,
                    'relative items-center overflow-x-auto px-4 py-4',
                    !isLast && css.withSeparator,
                  )}
                >
                  <PositionsHeader protocol={protocol} fiatTotal={positionsFiatTotal} />
                </AccordionTrigger>

                <AccordionContent className="px-4 pb-4 pt-0">
                  {protocol.items.map((group, groupIndex) => (
                    <PositionGroup
                      key={groupIndex}
                      group={group}
                      isLast={groupIndex === protocol.items.length - 1}
                      protocolIconUrl={protocol.protocol_metadata.icon.url}
                    />
                  ))}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )
        })}
      </div>
    </WidgetCard>
  )
}
