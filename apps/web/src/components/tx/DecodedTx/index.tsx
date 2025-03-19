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
  useTheme,
} from '@mui/material'
import type { Palette } from '@mui/material'
import { type SafeTransaction } from '@safe-global/safe-core-sdk-types'
import type { TransactionDetails } from '@safe-global/safe-gateway-typescript-sdk'
import Summary from '@/components/transactions/TxDetails/Summary'
import { trackEvent, MODALS_EVENTS } from '@/services/analytics'
import Multisend from '@/components/transactions/TxDetails/TxData/DecodedData/Multisend'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import accordionCss from '@/styles/accordion.module.css'
import HelpToolTip from './HelpTooltip'

enum ColorLevel {
  info = 'info',
  warning = 'warning',
  error = 'error',
}

const METHOD_LEVELS = {
  [ColorLevel.error]: ['setFallbackHandler'],
  [ColorLevel.warning]: [
    'addOwnerWithThreshold',
    'changeThreshold',
    'disableModule',
    'enableModule',
    'removeOwner',
    'setGuard',
    'swapOwner',
  ],
}

const getMethodLevel = (method?: string): ColorLevel => {
  if (!method) {
    return ColorLevel.info
  }

  const methodLevels = Object.keys(METHOD_LEVELS) as (keyof typeof METHOD_LEVELS)[]
  return (methodLevels.find((key) => METHOD_LEVELS[key].includes(method)) as ColorLevel) || ColorLevel.info
}

const getColors = ({ info, warning, error }: Palette): Record<ColorLevel, { main: string; background?: string }> => ({
  info: { main: info.dark, background: info.background },
  warning: { main: warning.main, background: warning.background },
  error: { main: error.main, background: error.background },
})

const StyledAccordion = styled(Accordion)<{ color?: ColorLevel }>(({ theme, color = ColorLevel.info }) => {
  const colors = getColors(theme.palette)
  const { main, background } = colors[color] || colors.info
  return {
    [`&.${accordionClasses.expanded}.${accordionClasses.root}, &:hover.${accordionClasses.root}`]: {
      borderColor: main,
    },
    [`&.${accordionClasses.expanded} .${accordionSummaryClasses.root}`]: {
      background,
      backgroundColor: background,
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
  const { palette } = useTheme()
  const decodedData = txData?.dataDecoded
  const isMultisend = decodedData?.parameters && !!decodedData?.parameters[0]?.valueDecoded
  const isMethodCallInAdvanced = showAdvancedDetails && (!showMethodCall || (isMultisend && showMultisend))
  const method = decodedData?.method
  const level = useMemo(() => getMethodLevel(method), [method])
  const colors = getColors(palette)[level]

  let toInfo = tx && {
    value: tx.data.to,
  }
  if (txInfo && isCustomTxInfo(txInfo)) {
    toInfo = txInfo.to
  }

  const decodedDataBlock = <DecodedData txData={txData} toInfo={toInfo} />
  const showDecodedData = isMethodCallInAdvanced && method
  const hideDecodedDataInAdvanced = !showDecodedData || (isMethodCallInAdvanced && !!method)

  const methodLabel =
    txInfo && isTransferTxInfo(txInfo) && isNativeTokenTransfer(txInfo.transferInfo)
      ? 'native transfer'
      : isMethodCallInAdvanced
        ? method
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
            color={level}
          >
            <AccordionSummary
              data-testid="decoded-tx-summary"
              expandIcon={<ExpandMoreIcon />}
              className={accordionCss.accordion}
            >
              <Stack direction="row" justifyContent="space-between" width="100%">
                <Box sx={{ alignContent: 'center' }}>
                  Advanced details
                  <HelpToolTip />
                </Box>
                {methodLabel && (
                  <Typography
                    component="span"
                    variant="body2"
                    alignContent="center"
                    color={colors.main}
                    py={0.5}
                    px={1}
                    borderRadius={0.5}
                    sx={{ background: colors.background }}
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
