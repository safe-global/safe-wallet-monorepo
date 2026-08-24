import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactNode, CSSProperties } from 'react'
import { type ReactElement, memo, useMemo } from 'react'
import { isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import { cn } from '@/utils/cn'
import HelpTooltip from './HelpTooltip'
import { useDarkMode } from '@/hooks/useDarkMode'
import css from './styles.module.css'

enum ColorLevel {
  info = 'info',
  warning = 'warning',
  success = 'success',
}

const TX_INFO_LEVEL = {
  [ColorLevel.warning]: ['SettingsChange'],
  [ColorLevel.success]: ['Transfer', 'SwapTransfer', 'TwapOrder', 'NativeStakingDeposit'],
}

/** `main` inks the chip, `background` tints the chip and the open row, `border` outlines the panel. */
const TxInfoColors: Record<ColorLevel, { main: string; mainDark?: string; border: string; background: string }> = {
  [ColorLevel.info]: { main: 'info.dark', border: 'info.background', background: 'info.background' },
  // The shadcn warning pair, which light mode pins to the Figma yellows rather than the brand coral.
  [ColorLevel.warning]: { main: '--warning-strong', border: '--warning-subtle', background: '--warning-subtle' },
  [ColorLevel.success]: {
    main: 'success.main',
    mainDark: 'primary.main',
    border: 'background.light',
    background: 'background.light',
  },
}

const getMethodLevel = (txInfo?: TransactionDetails['txInfo']['type']): ColorLevel => {
  if (!txInfo) {
    return ColorLevel.info
  }

  const methodLevels = Object.keys(TX_INFO_LEVEL) as (keyof typeof TX_INFO_LEVEL)[]
  return (methodLevels.find((key) => TX_INFO_LEVEL[key].includes(txInfo)) as ColorLevel) || ColorLevel.info
}

// Dotted names map onto Safe's `--color-*` scale; a leading `--` passes through for the shadcn
// tokens, whose `--color-*` aliases are `@theme inline` and so have no runtime value.
const toCssVar = (color: string) =>
  color.startsWith('--') ? `var(${color})` : `var(--color-${color.replace('.', '-')})`

type DecodedTxProps = {
  txInfo?: TransactionDetails['txInfo']
  txData?: TransactionDetails['txData']
  children: ReactNode
  defaultExpanded?: boolean
}

export const Divider = () => <Separator className={css.divider} />

const onValueChange = (value: string[]) => {
  trackEvent({ ...MODALS_EVENTS.TX_DETAILS, label: value.includes('tx-details') ? 'Open' : 'Close' })
}

const ColorCodedTxAccordion = ({ txInfo, txData, children, defaultExpanded }: DecodedTxProps): ReactElement => {
  const isDarkMode = useDarkMode()
  const decodedData = txData?.dataDecoded
  const level = useMemo(() => getMethodLevel(txInfo?.type), [txInfo?.type])
  const colors = TxInfoColors[level]

  const methodLabel =
    txInfo && isTransferTxInfo(txInfo) && isNativeTokenTransfer(txInfo.transferInfo)
      ? 'native transfer'
      : decodedData?.method

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

export default memo(ColorCodedTxAccordion)
