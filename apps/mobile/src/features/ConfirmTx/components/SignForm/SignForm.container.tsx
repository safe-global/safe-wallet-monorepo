import { Address } from '@/src/types/address'
import { SignForm } from './SignForm'
import React from 'react'
import { createExistingTx } from '@/src/services/tx/tx-sender'
import SafeApiKit from '@safe-global/api-kit'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { useAppSelector } from '@/src/store/hooks'
import { selectChainById } from '@/src/store/chains'
import { RootState } from '@/src/store'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useSign } from '@/src/hooks/useSign'
import { createConnectedWallet } from '@/src/services/web3'
import { signTx } from '@/src/services/tx/tx-sender/sign'

export interface SignFormContainerProps {
  address: Address
  name?: string
  txId: string
}

// ---------------------------------------------------------------------------------------------------------------------
// Move to the another file. Something to manage wallet and rpc connections
// ---------------------------------------------------------------------------------------------------------------------

export function SignFormContainer({ address, name, txId }: SignFormContainerProps) {
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { getPrivateKey } = useSign()

  const onSignPress = async () => {
    try {
      if (!activeChain) {
        throw new Error('Active chain not found')
      }

      const privateKey = await getPrivateKey(address)

      if (!privateKey) {
        throw new Error('Private key not found')
      }
      console.log('privateKey', privateKey)
      const { protocolKit, wallet } = await createConnectedWallet(privateKey, activeSafe, activeChain as ChainInfo)
      const { safeTx, signatures } = await createExistingTx({
        activeSafe,
        txId: txId,
        chain: activeChain as ChainInfo,
        privateKey,
      })

      const apiKit = new SafeApiKit({ chainId: BigInt(activeSafe.chainId) })

      if (!safeTx) {
        return
      }

      const safeTransactionHash = await signTx({
        safeTx,
        signatures,
        protocolKit,
        wallet,
        apiKit,
      })

      const signedTransaction = await apiKit.getTransaction(safeTransactionHash)

      console.log(signedTransaction, 'signed transaction')
    } catch (err) {
      console.log('deu pau pai')
      console.log(err)
    }
  }

  return <SignForm address={address} name={name} txId={txId} onSignPress={onSignPress} />
}
