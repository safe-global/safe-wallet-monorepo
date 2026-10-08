import type { ReactNode, CSSProperties, ReactElement } from 'react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { cn } from '@/utils/cn'
import HelpTooltip from './HelpTooltip'
import css from './styles.module.css'

export enum ColorLevel {
  info = 'info',
  warning = 'warning',
  success = 'success',
}

/**
 * `main` inks the chip, `background` tints the chip and the open row, `border` colours the panel
 * outline on hover and while open. #8040 set every `border` to its own `background`, which is why the
 * outline read as absent; these are the pre-migration values.
 */
const TxInfoColors: Record<ColorLevel, { main: string; mainDark?: string; border: string; background: string }> = {
  [ColorLevel.info]: { main: 'info.dark', border: 'info.dark', background: 'info.background' },
  // The shadcn warning trio, which light mode pins to the Figma yellows rather than the brand coral.
  [ColorLevel.warning]: { main: '--warning-strong', border: '--warning-outline', background: '--warning-subtle' },
  [ColorLevel.success]: {
    main: 'success.main',
    mainDark: 'primary.main',
    border: 'success.light',
    background: 'background.light',
  },
}

// Dotted names map onto Safe's `--color-*` scale; a leading `--` passes through for the shadcn
// tokens, whose `--color-*` aliases are `@theme inline` and so have no runtime value.
const toCssVar = (color: string) =>
  color.startsWith('--') ? `var(${color})` : `var(--color-${color.replace('.', '-')})`

export const Divider = () => <Separator className={css.divider} />

export type ColorCodedTxAccordionViewProps = {
  level: ColorLevel
  isDarkMode: boolean
  isNativeTransfer: boolean
  method?: string
  defaultExpanded?: boolean
  onValueChange: (value: string[]) => void
  children: ReactNode
}

export const ColorCodedTxAccordionView = ({
  level,
  isDarkMode,
  isNativeTransfer,
  method,
  defaultExpanded,
  onValueChange,
  children,
}: ColorCodedTxAccordionViewProps): ReactElement => {
  const colors = TxInfoColors[level]
  const methodLabel = isNativeTransfer ? 'native transfer' : method

  const accordionVars = {
    '--accordion-border-active': toCssVar(colors.border),
    '--accordion-fill-active': toCssVar(colors.background),
  } as CSSProperties

  return (
    <Card style={accordionVars} className={css.item}>
      <Accordion defaultValue={defaultExpanded ? ['tx-details'] : []} onValueChange={onValueChange}>
        <AccordionItem value="tx-details" className="border-0">
          <AccordionTrigger data-testid="decoded-tx-summary" className={cn(css.trigger, 'items-center px-4')}>
            <div className="flex w-full flex-row items-center justify-between">
              <Typography variant="paragraph-small-bold" data-testid="tx-advanced-details">
                Transaction details
                <HelpTooltip />
              </Typography>

              {methodLabel && (
                <Badge
                  variant="outline"
                  className={css.methodChip}
                  style={{
                    color: isDarkMode ? toCssVar(colors.mainDark ?? colors.main) : toCssVar(colors.main),
                    backgroundColor: toCssVar(colors.background),
                  }}
                >
                  {methodLabel}
                </Badge>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent data-testid="decoded-tx-details" className={cn(css.content, 'p-4')}>
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}
