import useWallet from '@/hooks/wallets/useWallet'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import { getSpendingLimitContract } from '@/services/contracts/spendingLimitContracts'
import useAsync from '@safe-global/utils/hooks/useAsync'
import { type SpendingLimitTxParams } from '@/components/tx-flow/flows/TokenTransfer/ReviewSpendingLimitTx'
import useChainId from '@/hooks/useChainId'
import useSafeInfo from './useSafeInfo'

const useSpendingLimitGas = (params: SpendingLimitTxParams) => {
  const chainId = useChainId()
  const provider = useWeb3ReadOnly()
  const wallet = useWallet()
  const { safe } = useSafeInfo()

  const [gasLimit, gasLimitError, gasLimitLoading] = useAsync<bigint | undefined>(async () => {
    if (!provider || !wallet || !safe.modules?.length) return

    const contract = getSpendingLimitContract(chainId, safe.modules, provider)

    const data = contract.interface.encodeFunctionData('executeAllowanceTransfer', [
      params.safeAddress,
      params.token,
      params.to,
      params.amount,
      params.paymentToken,
      params.payment,
      params.delegate,
      params.signature,
    ])

    return provider.estimateGas({
      to: await contract.getAddress(),
      from: wallet.address,
      data,
    })
  }, [provider, wallet, chainId, params, safe.modules])

  return { gasLimit, gasLimitError, gasLimitLoading }
}

export default useSpendingLimitGas
