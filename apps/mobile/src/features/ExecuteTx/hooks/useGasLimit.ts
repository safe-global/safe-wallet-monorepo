import { createConnectedWallet } from '@/src/services/web3'
import { useEffect, useState } from 'react'
import { getPrivateKey } from '@/src/hooks/useSign'
import logger from '@/src/utils/logger'
import { useAppSelector } from '@/src/store/hooks'
import { selectActiveSigner } from '@/src/store/activeSignerSlice'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import type { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { useTransactionData } from '@/src/features/ConfirmTx/hooks/useTransactionData'
import useSafeTx from '@/src/hooks/useSafeTx'
import { encodeSignatures } from '@safe-global/web/src/services/tx/encodeSignatures'
import { getWeb3ReadOnly } from '@/src/hooks/wallets/web3'

const useGasLimit = (txId: string) => {
  const [gasLimit, setGasLimit] = useState<bigint>()
  const activeSafe = useDefinedActiveSafe()
  const activeSigner = useAppSelector((state) => selectActiveSigner(state, activeSafe.address))
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const { data: txDetails } = useTransactionData(txId || '')
  const safeTx = useSafeTx(txDetails)
  const web3ReadOnly = getWeb3ReadOnly()

  useEffect(() => {
    if (!safeTx) {
      return
    }

    const getGasLimit = async () => {
      const signerAddress = activeSigner?.value || ''

      let privateKey
      try {
        privateKey = await getPrivateKey(signerAddress)
      } catch (error) {
        logger.error('Error loading private key:', error)
      }

      if (!privateKey) {
        return
      }

      const { protocolKit } = await createConnectedWallet(privateKey, activeSafe, activeChain)

      // @ts-ignore union type is too complex
      const encodedSafeTx = protocolKit
        .getContractManager()
        .safeContract?.encode('execTransaction', [
          safeTx.data.to,
          safeTx.data.value,
          safeTx.data.data,
          safeTx.data.operation,
          safeTx.data.safeTxGas,
          safeTx.data.baseGas,
          safeTx.data.gasPrice,
          safeTx.data.gasToken,
          safeTx.data.refundReceiver,
          encodeSignatures(safeTx, signerAddress, false),
        ])

      const gasLimit = await web3ReadOnly?.estimateGas({
        to: activeSafe.address,
        from: signerAddress,
        data: encodedSafeTx,
      })

      setGasLimit(gasLimit)
    }

    getGasLimit()
  }, [activeSigner?.value, activeSafe, activeChain, web3ReadOnly])

  return gasLimit
}

export default useGasLimit
