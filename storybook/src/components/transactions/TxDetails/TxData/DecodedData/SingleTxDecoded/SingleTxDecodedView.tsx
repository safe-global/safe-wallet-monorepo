import type { ReactNode, SyntheticEvent } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card } from '@/components/ui/card'
import { Typography } from '@/components/ui/typography'
import { Code } from 'lucide-react'
import css from './styles.module.css'
import { cn } from '@/utils/cn'

type OnAccordionChange = (event: SyntheticEvent, expanded: boolean) => void

export type SingleTxDecodedViewProps = {
  actionTitle: string
  variant?: 'elevation' | 'outlined'
  radius?: 'lg' | 'xl' | 'none'
  expanded?: boolean
  onChange?: OnAccordionChange
  actions?: ReactNode
  name?: string | null
  methodName?: string
  isNativeTransfer: boolean
  transferInfo?: ReactNode
  decodedData: ReactNode
}

export const SingleTxDecodedView = ({
  actionTitle,
  variant,
  radius,
  expanded,
  onChange,
  actions,
  name,
  methodName,
  isNativeTransfer,
  transferInfo,
  decodedData,
}: SingleTxDecodedViewProps) => {
  const method = methodName || (isNativeTransfer ? 'native transfer' : 'contract interaction')

  const accordionProps = onChange
    ? {
        value: expanded ? ['action'] : [],
        onValueChange: (value: string[], details?: { event?: Event }) =>
          onChange(details?.event as unknown as SyntheticEvent, value.includes('action')),
      }
    : { defaultValue: expanded ? ['action'] : [] }

  const isGrouped = variant === 'outlined'

  const accordionBody = (
    <>
      <AccordionTrigger
        data-testid="action-item"
        // The trigger hosts the `actions` slot below, so it cannot be a native <button>. Base UI
        // only applies its Enter/Space fallback when told the element isn't one.
        nativeButton={false}
        render={<div />}
        className={cn(
          'flex min-h-12 items-center px-4 py-3',
          isGrouped ? css.groupedTrigger : css.elevationTrigger,
          isGrouped && expanded && css.groupedTriggerOpen,
        )}
      >
        <div className={css.summary}>
          <Code className="size-4 shrink-0 text-muted-foreground" />
          <span className={css.summaryIndex}>{actionTitle}</span>
          {transferInfo ? (
            transferInfo
          ) : (
            <Typography className={css.summaryLabel}>
              {name ? `${name}: ` : ''}
              <b>{method}</b>
            </Typography>
          )}
        </div>

        {actions !== undefined && <div className={css.actions}>{actions}</div>}
      </AccordionTrigger>

      <AccordionContent className={cn('p-4', isGrouped && 'border-t border-border bg-card')}>
        <div className="flex flex-col gap-2">{decodedData}</div>
      </AccordionContent>
    </>
  )

  return (
    <Accordion data-testid="action-accordion" {...accordionProps}>
      <AccordionItem value="action" className="border-0">
        {isGrouped ? (
          accordionBody
        ) : (
          <Card size="none" radius={radius}>
            {accordionBody}
          </Card>
        )}
      </AccordionItem>
    </Accordion>
  )
}
