import type { ReactNode } from 'react'
import type { Protocol } from '@safe-global/store/gateway/AUTO_GENERATED/positions'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import PositionsHeader from '@views/features/positions/components/PositionsHeader'
import { PositionGroup } from '@views/features/positions/components/PositionGroup'

export type PositionsViewProps = {
  protocols: Protocol[]
  positionsFiatTotal?: number
  isPortfolioDisabled: boolean
  renderTotalAssetValue: (props: { title: string }) => ReactNode
}

export const PositionsView = ({
  protocols,
  positionsFiatTotal,
  isPortfolioDisabled,
  renderTotalAssetValue,
}: PositionsViewProps) => {
  return (
    <div className="flex flex-col gap-4">
      <div>
        {renderTotalAssetValue({ title: 'Total positions value' })}

        {isPortfolioDisabled && (
          <Typography variant="paragraph-mini" className="mt-4 block text-[var(--color-text-secondary)]">
            Position balances are not included in the total asset value.
          </Typography>
        )}
      </div>

      {protocols.map((protocol) => {
        return (
          <div key={protocol.protocol} className="overflow-hidden rounded-xl bg-card">
            <Accordion defaultValue={[protocol.protocol]}>
              <AccordionItem value={protocol.protocol} className="border-b-0">
                <AccordionTrigger className="items-center overflow-x-auto px-6 py-4">
                  <PositionsHeader protocol={protocol} fiatTotal={positionsFiatTotal} />
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-0">
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
          </div>
        )
      })}
    </div>
  )
}
