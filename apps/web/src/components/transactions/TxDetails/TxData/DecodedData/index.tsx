import type { AddressInfo, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import type { ReactElement } from 'react'
import { Stack, Typography } from '@mui/material'
import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { MethodDetails } from '@/components/transactions/TxDetails/TxData/DecodedData/MethodDetails'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import SendToBlock from '@/components/tx/SendToBlock'
import MethodCall from './MethodCall'
import { useNativeTokenInfo } from '@/hooks/useNativeTokenInfo'
import { DelegateCallWarning, UntrustedFallbackHandlerWarning } from '@/components/transactions/Warning'
import { useSetsUntrustedFallbackHandler } from '@/components/tx/confirmation-views/SettingsChange/UntrustedFallbackHandlerTxAlert'
import { isPolicyTxMethod, policyTxMethodOf } from '@/features/spaces/services'
import { SpacesFeature } from '@/features/spaces'
import { useLoadFeature } from '@/features/__core__'

interface Props {
  txData: TransactionDetails['txData']
  toInfo?: AddressInfo
  isTxExecuted?: boolean
  isWarningEnabled?: boolean
}

const DecodedData = ({
  txData,
  toInfo,
  isTxExecuted = false,
  isWarningEnabled = false,
}: Props): ReactElement | null => {
  const nativeTokenInfo = useNativeTokenInfo()
  const setsUntrustedFallbackHandler = useSetsUntrustedFallbackHandler(txData)
  const spaces = useLoadFeature(SpacesFeature)

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
  const toAddress = toInfo?.value || txData.to?.value
  // The gateway has no ABI for the policy guard on most chains, so `dataDecoded` is empty
  // there; the selector identifies the call either way. Its own decode still wins when it
  // reads the calldata as some other method.
  const policyMethod = policyTxMethodOf(txData.hexData)
  const decodedMethod = txData.dataDecoded?.method
  // With the feature off (or broken) its component is a stub that renders null, so fall
  // back to the generic view rather than showing nothing.
  const canShowPolicies = !spaces.$isDisabled && !spaces.$error
  const isPolicyTx = !!policyMethod && canShowPolicies && (!decodedMethod || isPolicyTxMethod(decodedMethod))
  const method = decodedMethod || (isPolicyTx ? policyMethod : '') || ''
  const addressInfo = txData.addressInfoIndex?.[toAddress]
  const name = addressInfo?.name || toInfo?.name || txData.to?.name
  const avatar = addressInfo?.logoUri || toInfo?.logoUri || txData.to?.logoUri

  return (
    <Stack spacing={2}>
      {setsUntrustedFallbackHandler && <UntrustedFallbackHandlerWarning isTxExecuted={isTxExecuted} />}
      <DelegateCallWarning txData={txData} showWarning={isWarningEnabled} />

      {method ? (
        <MethodCall contractAddress={toAddress} contractName={name} contractLogo={avatar} method={method} />
      ) : (
        <SendToBlock address={toAddress} name={name} title="Interacted with" avatarSize={20} customAvatar={avatar} />
      )}

      {amountInWei !== '0' && <SendAmountBlock title="Value" amountInWei={amountInWei} tokenInfo={nativeTokenInfo} />}

      {isPolicyTx ? (
        // A policy configuration reads as an array of structs otherwise; show the policies.
        <spaces.PolicyTxDetails txData={txData} />
      ) : txData.dataDecoded ? (
        <MethodDetails data={txData.dataDecoded} hexData={txData.hexData} addressInfoIndex={txData.addressInfoIndex} />
      ) : txData.hexData ? (
        <Typography data-testid="hexData" variant="body2" component="div">
          <HexEncodedData title="Data" hexData={txData.hexData} />
        </Typography>
      ) : null}
    </Stack>
  )
}

export default DecodedData
