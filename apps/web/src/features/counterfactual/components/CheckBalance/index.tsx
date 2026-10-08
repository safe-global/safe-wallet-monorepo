import ActivateAccountButton from '../ActivateAccountButton'
import { useCurrentChain } from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { getBlockExplorerLink } from '@safe-global/utils/utils/chains'
import { CheckBalanceView } from '@views/features/counterfactual/components/CheckBalance/CheckBalanceView'

const CheckBalance = () => {
  const { safe, safeAddress } = useSafeInfo()
  const chain = useCurrentChain()

  if (safe.deployed) return null

  const blockExplorerLink = chain ? getBlockExplorerLink(chain, safeAddress) : undefined

  return (
    <CheckBalanceView blockExplorerHref={blockExplorerLink?.href} activateAccountButton={<ActivateAccountButton />} />
  )
}

export default CheckBalance
