import { useState } from 'react'
import type { ReactElement } from 'react'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'
import { WcHintsView, type HintAccordionKey } from '@views/features/walletconnect/components/WcHints/WcHintsView'

const WcHints = (): ReactElement => {
  const [expandedAccordion, setExpandedAccordion] = useState<HintAccordionKey | null>(null)

  const onExpand = (accordion: HintAccordionKey) => {
    setExpandedAccordion((prev) => {
      return prev === accordion ? null : accordion
    })

    trackEvent(WALLETCONNECT_EVENTS.HINTS_EXPAND)
  }

  return <WcHintsView expandedAccordion={expandedAccordion} onExpand={onExpand} />
}

export default WcHints
