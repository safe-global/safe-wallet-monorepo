import { useWeb3ReadOnly } from './wallets/web3'
import useSafeInfo from './useSafeInfo'
import { lookupAddress } from '@/services/ens'
import useAsync from '@safe-global/utils/hooks/useAsync'

const useResolvedOwners = () => {
  const { safe } = useSafeInfo()
  const ethersProvider = useWeb3ReadOnly()

  const [resolvedOwners] = useAsync(async () => {
    if (!ethersProvider || !safe.owners.length) {
      return safe.owners
    }

    return await Promise.all(
      safe.owners.map(async (owner) => {
        const address = owner.value
        let name: string | undefined = owner.name ?? undefined

        if (!name || name === '') {
          try {
            name = await lookupAddress(ethersProvider, owner.value)
          } catch (error) {
            console.warn('Failed to resolve ENS name for address:', address, error)
          }
        }

        return { ...owner, name }
      }),
    )
  }, [safe.owners, ethersProvider])

  return resolvedOwners ?? safe.owners
}

export default useResolvedOwners
