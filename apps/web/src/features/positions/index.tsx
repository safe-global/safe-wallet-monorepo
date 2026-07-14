import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import PositionsHeader from './components/PositionsHeader'
import { PositionGroup } from './components/PositionGroup'
import usePositions from './hooks/usePositions'
import PositionsEmpty from './components/PositionsEmpty'
import usePositionsFiatTotal from './hooks/usePositionsFiatTotal'
import React from 'react'
import PositionsUnavailable from './components/PositionsUnavailable'
import TotalAssetValue from '@/components/balances/TotalAssetValue'
import PositionsSkeleton from './components/PositionsSkeleton'
import { PortfolioFeature } from '@/features/portfolio'
import { useLoadFeature } from '@/features/__core__'

export { default as useIsPositionsFeatureEnabled } from './hooks/useIsPositionsFeatureEnabled'

const Positions = () => {
  const positionsFiatTotal = usePositionsFiatTotal()
  const { data: protocols, error, isLoading } = usePositions()
  const portfolio = useLoadFeature(PortfolioFeature)

  if (isLoading) {
    return <PositionsSkeleton />
  }

  if (error || !protocols) return <PositionsUnavailable hasError={!!error} />

  if (protocols.length === 0) {
    return <PositionsEmpty entryPoint="Positions" />
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <TotalAssetValue
          fiatTotal={positionsFiatTotal}
          title="Total positions value"
          action={<portfolio.PortfolioRefreshHint entryPoint="Positions" />}
        />

        {portfolio.$isDisabled && (
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
                <AccordionTrigger className="overflow-x-auto px-6 py-4">
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

export default Positions
