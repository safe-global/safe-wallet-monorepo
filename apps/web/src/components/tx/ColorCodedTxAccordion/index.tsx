import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactNode } from 'react'
import { type ReactElement, memo, useMemo } from 'react'
import { isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import { useDarkMode } from '@/hooks/useDarkMode'
import {
  ColorCodedTxAccordionView,
  ColorLevel,
} from '@views/components/tx/ColorCodedTxAccordion/ColorCodedTxAccordionView'

export { Divider } from '@views/components/tx/ColorCodedTxAccordion/ColorCodedTxAccordionView'

const TX_INFO_LEVEL = {
  [ColorLevel.warning]: ['SettingsChange'],
  [ColorLevel.success]: ['Transfer', 'SwapTransfer', 'TwapOrder', 'NativeStakingDeposit'],
}

const getMethodLevel = (txInfo?: TransactionDetails['txInfo']['type']): ColorLevel => {
  if (!txInfo) {
    return ColorLevel.info
  }

  const methodLevels = Object.keys(TX_INFO_LEVEL) as (keyof typeof TX_INFO_LEVEL)[]
  return (methodLevels.find((key) => TX_INFO_LEVEL[key].includes(txInfo)) as ColorLevel) || ColorLevel.info
}

type DecodedTxProps = {
  txInfo?: TransactionDetails['txInfo']
  txData?: TransactionDetails['txData']
  children: ReactNode
  defaultExpanded?: boolean
}

const onValueChange = (value: string[]) => {
  trackEvent({ ...MODALS_EVENTS.TX_DETAILS, label: value.includes('tx-details') ? 'Open' : 'Close' })
}

const ColorCodedTxAccordion = ({ txInfo, txData, children, defaultExpanded }: DecodedTxProps): ReactElement => {
  const isDarkMode = useDarkMode()
  const decodedData = txData?.dataDecoded
  const level = useMemo(() => getMethodLevel(txInfo?.type), [txInfo?.type])

  const isNativeTransfer = !!txInfo && isTransferTxInfo(txInfo) && isNativeTokenTransfer(txInfo.transferInfo)

  return (
    <ColorCodedTxAccordionView
      level={level}
      isDarkMode={isDarkMode}
      isNativeTransfer={isNativeTransfer}
      method={decodedData?.method}
      defaultExpanded={defaultExpanded}
      onValueChange={onValueChange}
    >
      {children}
    </ColorCodedTxAccordionView>
  )
}

export default memo(ColorCodedTxAccordion)
