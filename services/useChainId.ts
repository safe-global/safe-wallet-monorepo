import { useRouter } from 'next/router'
import { IS_PRODUCTION } from '@/config/constants'
import chains from '@/config/chains'
import { useAppSelector } from '@/store'
import { selectSession } from '@/store/sessionSlice'

const defaultChainId = IS_PRODUCTION ? chains.eth : chains.rin

export const useChainId = (): string => {
  const router = useRouter()
  const session = useAppSelector(selectSession)
  const chain = Array.isArray(router.query.chain) ? router.query.chain[0] : router.query.chain || ''
  const safe = Array.isArray(router.query.safe) ? router.query.safe[0] : router.query.safe || ''
  const shortName = safe.split(':')[0] || chain

  if (shortName) {
    const chainId = Object.entries(chains).find(([key]) => key === shortName)?.[1]
    if (chainId == null) {
      throw Error('Invalid chain short name in the URL')
    }
    return chainId
  }

  return session.lastChainId || defaultChainId
}

export default useChainId
