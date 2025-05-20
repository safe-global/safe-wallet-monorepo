import type { ReactElement } from 'react'
import { Stack, Typography } from '@mui/material'
import { type AddressEx, type TransactionDetails, Operation } from '@safe-global/safe-gateway-typescript-sdk'

import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { MethodDetails } from '@/components/transactions/TxDetails/TxData/DecodedData/MethodDetails'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import MethodCall from './MethodCall'
import { DelegateCallWarning } from '@/components/transactions/Warning'
import { useNativeTokenInfo } from '@/hooks/useNativeTokenInfo'

interface Props {
  txData: TransactionDetails['txData']
  toInfo?: AddressEx
}

export const DecodedData = ({ txData, toInfo }: Props): ReactElement | null => {
  const nativeTokenInfo = useNativeTokenInfo()

  // nothing to render
  if (!txData) {
    if (!toInfo) return null

    return (
      <SendToBlock
        title="Interact with"
        address={toInfo.value}
        name={toInfo.name}
        customAvatar={toInfo.logoUri}
        avatarSize={26}
      />
    )
  }

  const amountInWei = txData.value ?? '0'
  const isDelegateCall = txData.operation === Operation.DELEGATE
  const toAddress = toInfo?.value || txData.to?.value
  const method = txData.dataDecoded?.method || ''
  const addressInfo = txData.addressInfoIndex?.[toAddress]
  const name = addressInfo?.name || toInfo?.name || txData.to?.name
  const avatar = addressInfo?.logoUri || toInfo?.logoUri || txData.to?.logoUri

  return (
    <Stack spacing={2}>
      {isDelegateCall && <DelegateCallWarning showWarning={!txData.trustedDelegateCallTarget} />}

      {method ? (
        <MethodCall contractAddress={toAddress} contractName={name} contractLogo={avatar} method={method} />
      ) : (
        <SendToBlock address={toAddress} name={name} title="Interacted with" avatarSize={20} customAvatar={avatar} />
      )}

      {amountInWei !== '0' && <SendAmountBlock title="Value" amountInWei={amountInWei} tokenInfo={nativeTokenInfo} />}

      {txData.dataDecoded ? (
        <MethodDetails data={txData.dataDecoded} hexData={txData.hexData} addressInfoIndex={txData.addressInfoIndex} />
      ) : txData.hexData ? (
        <Typography variant="body2" component="div">
          <HexEncodedData title="Data" hexData={txData.hexData} />
        </Typography>
      ) : null}
    </Stack>
  )
}

export default DecodedData
