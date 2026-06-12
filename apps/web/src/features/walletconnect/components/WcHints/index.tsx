import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import { Typography } from '@/components/ui/typography'
import { useState } from 'react'
import type { ReactElement } from 'react'
import Question from '@/public/images/common/question.svg'
import css from './styles.module.css'
import { trackEvent } from '@/services/analytics'
import { WALLETCONNECT_EVENTS } from '@/services/analytics/events/walletconnect'

const HintAccordion = ({
  title,
  items,
  expanded,
  onExpand,
}: {
  title: string
  items: Array<string>
  expanded: boolean
  onExpand: () => void
}): ReactElement => {
  return (
    <Accordion value={expanded ? ['item'] : []} onValueChange={onExpand}>
      <AccordionItem value="item">
        <AccordionTrigger>
          <Typography className={css.title}>
            <Question className={`size-4 ${css.questionIcon}`} />
            {title}
          </Typography>
        </AccordionTrigger>

        <AccordionContent className="p-0">
          <div className={css.list}>
            {items.map((item, i) => (
              <div key={i} className="flex items-center">
                <div className={`flex ${css.listItemAvatar}`}>
                  <div
                    className={`flex items-center justify-center rounded-full bg-[var(--color-border-light)] text-foreground ${css.avatar}`}
                  >
                    {i + 1}
                  </div>
                </div>
                <Typography variant="paragraph-small">{item}</Typography>
              </div>
            ))}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  )
}

const ConnectionTitle = 'How do I connect to a dApp?'
const ConnectionSteps = [
  'Open a WalletConnect supported dApp',
  'Connect a wallet',
  'Select WalletConnect as the wallet',
  'Copy the pairing code and paste it into the input field above',
  'Approve the session',
  'dApp is now connected to the Safe',
]

const InteractionTitle = 'How do I interact with a dApp?'
const InteractionSteps = [
  'Connect a dApp by following the above steps',
  'Ensure the dApp is connected to the same chain as your Safe Account',
  'Initiate a transaction/signature request via the dApp',
  'Transact/sign as normal via the Safe',
]

const WcHints = (): ReactElement => {
  const [expandedAccordion, setExpandedAccordion] = useState<'connection' | 'interaction' | null>(null)

  const onExpand = (accordion: 'connection' | 'interaction') => {
    setExpandedAccordion((prev) => {
      return prev === accordion ? null : accordion
    })

    trackEvent(WALLETCONNECT_EVENTS.HINTS_EXPAND)
  }

  return (
    <div className="flex flex-col gap-2">
      <HintAccordion
        title={ConnectionTitle}
        items={ConnectionSteps}
        onExpand={() => onExpand('connection')}
        expanded={expandedAccordion === 'connection'}
      />
      <HintAccordion
        title={InteractionTitle}
        items={InteractionSteps}
        onExpand={() => onExpand('interaction')}
        expanded={expandedAccordion === 'interaction'}
      />
    </div>
  )
}

export default WcHints
