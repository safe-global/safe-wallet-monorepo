import { type ReactElement, useRef } from 'react'
import LightbulbIcon from '@/public/images/common/lightbulb.svg'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion'
import type { CreateSafeInfoVariant } from '@/components/new-safe/create/CreateSafeInfos'
import css from 'src/components/new-safe/create/InfoWidget/styles.module.css'
import { CREATE_SAFE_EVENTS, trackEvent } from '@/services/analytics'

type InfoWidgetProps = {
  title: string
  steps: { title: string; text: string | ReactElement }[]
  variant: CreateSafeInfoVariant
  startExpanded?: boolean
}

const variantStyles: Record<CreateSafeInfoVariant, { card: string; pill: string }> = {
  info: {
    card: 'bg-[var(--color-info-background)] border-[var(--color-info-main)]',
    pill: 'bg-[var(--color-info-main)]',
  },
  success: {
    card: 'bg-[var(--color-success-background)] border-[var(--color-success-main)]',
    pill: 'bg-[var(--color-success-main)]',
  },
  warning: {
    card: 'bg-[var(--color-warning-background)] border-[var(--color-warning-main)]',
    pill: 'bg-[var(--color-warning-main)]',
  },
  error: {
    card: 'bg-[var(--color-error-background)] border-[var(--color-error-main)]',
    pill: 'bg-[var(--color-error-main)]',
  },
}

const InfoWidget = ({ title, steps, variant, startExpanded = false }: InfoWidgetProps): ReactElement | null => {
  const openCount = useRef(startExpanded ? steps.length : 0)

  if (steps.length === 0) {
    return null
  }

  const styles = variantStyles[variant]

  return (
    <Card variant="outlined" className={styles.card}>
      <div className={css.cardHeader}>
        <div className={`${css.title} ${styles.pill}`}>
          <LightbulbIcon className={css.titleIcon} />
          <Typography variant="paragraph-mini-bold">{title}</Typography>
        </div>
      </div>
      <div className="px-6">
        <Accordion
          multiple
          defaultValue={startExpanded ? steps.map((step) => step.title) : []}
          onValueChange={(value) => {
            const openValues = value.filter((item): item is string => typeof item === 'string')
            if (openValues.length > openCount.current) {
              const opened = openValues.at(-1)
              if (opened) {
                trackEvent({ ...CREATE_SAFE_EVENTS.OPEN_HINT, label: opened })
              }
            }
            openCount.current = openValues.length
          }}
        >
          {steps.map(({ title, text }) => (
            <AccordionItem key={title} value={title} className={css.tipAccordion}>
              <AccordionTrigger>{title}</AccordionTrigger>
              <AccordionContent>
                <Typography variant="paragraph-small">{text}</Typography>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Card>
  )
}

export default InfoWidget
