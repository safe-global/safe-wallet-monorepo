import type { ReactElement } from 'react'
import { Stack } from '@mui/material'
import { type AddressEx, TokenType, type TransactionDetails, Operation } from '@safe-global/safe-gateway-typescript-sdk'

import { HexEncodedData } from '@/components/transactions/HexEncodedData'
import { MethodDetails } from '@/components/transactions/TxDetails/TxData/DecodedData/MethodDetails'
import { useCurrentChain } from '@/hooks/useChains'
import SendAmountBlock from '@/components/tx-flow/flows/TokenTransfer/SendAmountBlock'
import { ZERO_ADDRESS } from '@safe-global/protocol-kit/dist/src/utils/constants'
import SendToBlock from '@/components/tx/SendToBlock'
import MethodCall from './MethodCall'
import useSafeAddress from '@/hooks/useSafeAddress'
import { sameAddress } from '@/utils/addresses'
import { DelegateCallWarning } from '@/components/transactions/Warning'

interface Props {
  txData: TransactionDetails['txData']
  toInfo?: AddressEx
}

export const DecodedData = ({ txData, toInfo }: Props): ReactElement | null => {
  const safeAddress = useSafeAddress()
  const chainInfo = useCurrentChain()

  // nothing to render
  if (!txData) {
    if (!toInfo) return null

    return (
      <SendToBlock
        title="Interact with:"
        address={toInfo.value}
        name={toInfo.name}
        customAvatar={toInfo.logoUri}
        avatarSize={26}
      />
    )
  }

  const amountInWei = txData.value ?? '0'
  const isDelegateCall = txData.operation === Operation.DELEGATE
  const toAddress = toInfo?.value || txData.to.value
  const method = txData.dataDecoded?.method || ''
  const addressInfo = txData.addressInfoIndex?.[toAddress]
  const name = sameAddress(toAddress, safeAddress)
    ? 'this Safe Account'
    : addressInfo?.name || toInfo?.name || txData.to.name
  const avatar = addressInfo?.logoUri || toInfo?.logoUri || txData.to.logoUri

  let decodedData = <></>
  if (txData.dataDecoded) {
    decodedData = (
      <MethodDetails data={txData.dataDecoded} hexData={txData.hexData} addressInfoIndex={txData.addressInfoIndex} />
    )
  } else if (txData.hexData) {
    // When no decoded data, display raw hex data
    decodedData = <HexEncodedData title="Data (hex-encoded)" hexData={txData.hexData} />
  }

  return (
    <Stack spacing={2}>
      {isDelegateCall && <DelegateCallWarning showWarning={!txData.trustedDelegateCallTarget} />}

      {method ? (
        <MethodCall contractAddress={toAddress} contractName={name} contractLogo={avatar} method={method} />
      ) : (
        <SendToBlock address={toAddress} name={name} title="Interacted with:" avatarSize={26} customAvatar={avatar} />
      )}

      {amountInWei !== '0' && (
        <SendAmountBlock
          title="Value:"
          amountInWei={amountInWei}
          tokenInfo={{
            type: TokenType.NATIVE_TOKEN,
            address: ZERO_ADDRESS,
            decimals: chainInfo?.nativeCurrency.decimals ?? 18,
            symbol: chainInfo?.nativeCurrency.symbol ?? 'ETH',
            logoUri: chainInfo?.nativeCurrency.logoUri,
          }}
        />
      )}

      {decodedData}
    </Stack>
  )
}

export default DecodedData
