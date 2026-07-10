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

const TxInfoColors: Record<ColorLevel, { main: string; mainDark?: string; background: string }> = {
  [ColorLevel.info]: { main: 'info.dark', background: 'info.background' },
  [ColorLevel.warning]: { main: 'warning.main', background: 'warning.background' },
  [ColorLevel.success]: {
    main: 'success.main',
    mainDark: 'primary.main',
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

const toCssVar = (color: string) => `var(--color-${color.replace('.', '-')})`

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
    '--accordion-bg-active': toCssVar(colors.background),
  } as CSSProperties

  return (
    <Card style={accordionVars} className={css.item}>
      <Accordion defaultValue={defaultExpanded ? ['tx-details'] : []} onValueChange={onValueChange}>
        <AccordionItem value="tx-details" className="border-0">
          <AccordionTrigger data-testid="decoded-tx-summary" className={cn(css.trigger, 'px-4 hover:no-underline')}>
            <div className="flex w-full flex-row items-center justify-between">
              <Typography variant="paragraph-small-bold" data-testid="tx-advanced-details">
                Transaction details
                <HelpTooltip />
              </Typography>

              {methodLabel && (
                // runtime color-mix per tx level (css.methodChip + inline style); not a fixed Badge variant
                <Badge
                  variant="outline"
                  className={css.methodChip}
                  style={{
                    color: isDarkMode ? toCssVar(colors.mainDark ?? colors.main) : toCssVar(colors.main),
                  }}
                >
                  {methodLabel}
                </Badge>
              )}
            </div>
          </AccordionTrigger>

          <AccordionContent data-testid="decoded-tx-details" className={cn(css.content, 'px-4')}>
            {children}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  )
}

export default memo(ColorCodedTxAccordion)
