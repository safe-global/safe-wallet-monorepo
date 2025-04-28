import { isEmptyHexData } from '@/utils/hex'
import { type InternalTransaction, type TransactionData } from '@safe-global/safe-gateway-typescript-sdk'
import type { AccordionProps } from '@mui/material/Accordion/Accordion'
import { Accordion, AccordionDetails, AccordionSummary, Stack, Typography } from '@mui/material'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import css from './styles.module.css'
import accordionCss from '@/styles/accordion.module.css'
import CodeIcon from '@mui/icons-material/Code'
import DecodedData from '@/components/transactions/TxDetails/TxData/DecodedData'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { getSafeToL2MigrationDeployment } from '@safe-global/safe-deployments'
import { useCurrentChain } from '@/hooks/useChains'
import {
  type Erc20Token,
  type NativeToken,
  type TransactionDetails,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { InlineTransferTxInfo } from '../../Transfer'
import { useMemo } from 'react'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'

type SingleTxDecodedProps = {
  tx: InternalTransaction
  txData: TransactionData
  actionTitle: string
  variant?: AccordionProps['variant']
  expanded?: boolean
  onChange?: AccordionProps['onChange']
}
const ERC20_INTERFACE = ERC20__factory.createInterface()

export const SingleTxDecoded = ({ tx, txData, actionTitle, variant, expanded, onChange }: SingleTxDecodedProps) => {
  const chain = useCurrentChain()
  const isNativeTransfer = tx.value !== '0' && (!tx.data || isEmptyHexData(tx.data))
  const method = tx.dataDecoded?.method || (isNativeTransfer ? 'native transfer' : 'contract interaction')

  const addressInfo = txData.addressInfoIndex?.[tx.to]
  const name = addressInfo?.name

  const safeToL2MigrationDeployment = getSafeToL2MigrationDeployment()
  const safeToL2MigrationAddress = chain && safeToL2MigrationDeployment?.networkAddresses[chain.chainId]
  const tokenInfoIndex = (txData as TransactionDetails['txData'])?.tokenInfoIndex

  const txDataHex = tx.data ?? txData.hexData

  const isTransfer = Boolean(txDataHex?.startsWith(ERC20_INTERFACE.getFunction('transfer').selector))

  const transferInfos:
    | {
        recipient: string
        transferValue: string
        tokenInfo: Erc20Token | NativeToken
      }
    | undefined = useMemo(() => {
    if ((!isTransfer && !isNativeTransfer) || !txDataHex || !chain) {
      return
    }
    try {
      if (isTransfer) {
        const [recipient, transferValue] = ERC20_INTERFACE.decodeFunctionData('transfer', txDataHex)
        const tokenInfo = isTransfer ? tokenInfoIndex?.[tx.to] : undefined

        if (tokenInfo?.type !== 'ERC20') {
          return
        }

        return { recipient, transferValue, tokenInfo }
      }

      if (!tx.value || tx.value === '0') {
        return
      }

      return {
        recipient: tx.to,
        transferValue: tx.value,
        tokenInfo: {
          type: 'NATIVE_TOKEN',
          address: ZERO_ADDRESS,
          decimals: chain.nativeCurrency.decimals,
          symbol: chain.nativeCurrency.symbol,
          logoUri: chain.nativeCurrency.logoUri,
          name: chain.nativeCurrency.name,
        },
      }
    } catch (error) {
      return
    }
  }, [isTransfer, isNativeTransfer, txDataHex, chain, tx.value, tx.to, tokenInfoIndex])

  const singleTxData = {
    to: { value: tx.to },
    value: tx.value,
    operation: tx.operation,
    dataDecoded: tx.dataDecoded,
    hexData: tx.data ?? undefined,
    addressInfoIndex: txData.addressInfoIndex,
    trustedDelegateCallTarget: sameAddress(tx.to, safeToL2MigrationAddress), // We only trusted a nested Migration
  }

  return (
    <Accordion variant={variant} expanded={expanded} onChange={onChange}>
      <AccordionSummary data-testid="action-item" expandIcon={<ExpandMoreIcon />} className={accordionCss.accordion}>
        <div className={css.summary}>
          <CodeIcon color="border" fontSize="small" />
          <Typography>{actionTitle}</Typography>
          {transferInfos ? (
            <InlineTransferTxInfo
              value={transferInfos.transferValue}
              tokenInfo={transferInfos.tokenInfo}
              recipient={transferInfos.recipient}
            />
          ) : (
            <Typography ml="8px">
              {name ? name + ': ' : ''}
              <b>{method}</b>
            </Typography>
          )}
        </div>
      </AccordionSummary>

      <AccordionDetails>
        <Stack spacing={1}>
          <DecodedData txData={singleTxData} toInfo={{ value: tx.to }} />
        </Stack>
      </AccordionDetails>
    </Accordion>
  )
}

export default SingleTxDecoded
