import { type SyntheticEvent, type ReactElement, memo, useMemo } from 'react'
import { isCustomTxInfo, isNativeTokenTransfer, isTransferTxInfo } from '@/utils/transaction-guards'
import {
  Accordion,
  accordionClasses,
  AccordionDetails,
  AccordionSummary,
  accordionSummaryClasses,
  Box,
  Stack,
  styled,
  Typography,
} from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import { TransactionInfoType, type TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import Summary from '@/components/transactions/TxDetails/Summary'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import accordionCss from '@/styles/accordion.module.css'
import HelpTooltip from './HelpTooltip'
import { useDarkMode } from '@/hooks/useDarkMode'

enum ColorLevel {
  info = 'info',
  warning = 'warning',
  success = 'success',
}

const TX_INFO_LEVEL = {
  [ColorLevel.warning]: [TransactionInfoType.SETTINGS_CHANGE],
  [ColorLevel.success]: [
    TransactionInfoType.TRANSFER,
    TransactionInfoType.SWAP_TRANSFER,
    TransactionInfoType.TWAP_ORDER,
    TransactionInfoType.NATIVE_STAKING_DEPOSIT,
  ],
}

const TxInfoColors: Record<ColorLevel, { main: string; mainDark?: string; background: string; border?: string }> = {
  [ColorLevel.info]: { main: 'info.dark', background: 'info.background' },
  [ColorLevel.warning]: { main: 'warning.main', background: 'warning.background', border: 'warning.light' },
  [ColorLevel.success]: {
    main: 'success.main',
    mainDark: 'primary.main',
    background: 'background.light',
    border: 'success.light',
  },
}

const getMethodLevel = (txInfo?: TransactionInfoType): ColorLevel => {
  if (!txInfo) {
    return ColorLevel.info
  }

  const methodLevels = Object.keys(TX_INFO_LEVEL) as (keyof typeof TX_INFO_LEVEL)[]
  return (methodLevels.find((key) => TX_INFO_LEVEL[key].includes(txInfo)) as ColorLevel) || ColorLevel.info
}

const toCssVar = (color: string) => `var(--color-${color.replace('.', '-')})`

const StyledAccordion = styled(Accordion)<{ colorLevel?: ColorLevel }>(({ colorLevel = ColorLevel.info }) => {
  const { main, border, background } = TxInfoColors[colorLevel]
  return {
    [`&.${accordionClasses.expanded}.${accordionClasses.root}, &:hover.${accordionClasses.root}`]: {
      borderColor: toCssVar(border || main),
    },
    [`&.${accordionClasses.expanded} .${accordionSummaryClasses.root}`]: {
      backgroundColor: toCssVar(background),
    },
  }
})

type DecodedTxProps = {
  tx?: SafeTransaction
  txId?: string
  txDetails?: TransactionDetails
  txInfo?: TransactionDetails['txInfo']
  txData?: TransactionDetails['txData']
  showMultisend?: boolean
  showMethodCall?: boolean
  showAdvancedDetails?: boolean
}

export const Divider = () => (
  <Box
    borderBottom="1px solid var(--color-border-light)"
    width="calc(100% + 32px)"
    my={2}
    sx={{ ml: '-16px !important' }}
  />
)

const onChangeExpand = (_: SyntheticEvent, expanded: boolean) => {
  trackEvent({ ...MODALS_EVENTS.TX_DETAILS, label: expanded ? 'Open' : 'Close' })
}

const DecodedTx = ({
  tx,
  txDetails,
  txInfo,
  txData,
  showMultisend = true,
  showMethodCall = false,
  showAdvancedDetails = true,
}: DecodedTxProps): ReactElement => {
  const isDarkMode = useDarkMode()
  const decodedData = txData?.dataDecoded
  const isMultisend = decodedData?.parameters && !!decodedData?.parameters[0]?.valueDecoded
  const isMethodCallInAdvanced = showAdvancedDetails && (!showMethodCall || (isMultisend && showMultisend))
  const level = useMemo(() => getMethodLevel(txInfo?.type), [txInfo?.type])
  const colors = TxInfoColors[level]

  let toInfo = tx && {
    value: tx.data.to,
  }
  if (txInfo && isCustomTxInfo(txInfo)) {
    toInfo = txInfo.to
  }

  const decodedDataBlock = <DecodedData txData={txData} toInfo={toInfo} />
  const showDecodedData = isMethodCallInAdvanced && decodedData?.method
  const hideDecodedDataInAdvanced = !showDecodedData || (isMethodCallInAdvanced && !!decodedData?.method)

  const methodLabel =
    txInfo && isTransferTxInfo(txInfo) && isNativeTokenTransfer(txInfo.transferInfo)
      ? 'native transfer'
      : isMethodCallInAdvanced
        ? decodedData?.method
        : undefined

  return (
    <Stack spacing={2}>
      {!isMethodCallInAdvanced && (
        <Box border="1px solid var(--color-border-light)" borderRadius={1} p={2}>
          {decodedDataBlock}
        </Box>
      )}

      {isMultisend && showMultisend && <Multisend txData={txData} compact />}

      {showAdvancedDetails && (
        <Box>
          <StyledAccordion
            elevation={0}
            onChange={onChangeExpand}
            sx={!tx ? { pointerEvents: 'none' } : undefined}
            colorLevel={level}
          >
            <AccordionSummary
              data-testid="decoded-tx-summary"
              expandIcon={<ExpandMoreIcon />}
              className={accordionCss.accordion}
            >
              <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%">
                <Box>
                  Advanced details
                  <HelpTooltip />
                </Box>

                {methodLabel && (
                  <Typography
                    component="span"
                    variant="body2"
                    alignContent="center"
                    color={isDarkMode ? (colors.mainDark ?? colors.main) : colors.main}
                    py={0.5}
                    px={1}
                    borderRadius={0.5}
                    bgcolor={colors.background}
                  >
                    {methodLabel}
                  </Typography>
                )}
              </Stack>
            </AccordionSummary>

            <AccordionDetails data-testid="decoded-tx-details">
              {showDecodedData && decodedDataBlock}

              {showDecodedData && hideDecodedDataInAdvanced && <Divider />}

              <Summary
                safeTxData={tx?.data}
                txData={txData}
                txInfo={txInfo}
                txDetails={txDetails}
                hideDecodedData={hideDecodedDataInAdvanced}
              />
            </AccordionDetails>
          </StyledAccordion>
        </Box>
      )}
    </Stack>
  )
}

export default memo(DecodedTx)
