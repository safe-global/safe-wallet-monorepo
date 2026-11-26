import { useCallback } from 'react'
import { getReadOnlyProvider } from '@/hooks/wallets/getReadOnlyProvider'
import { useChain } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { selectRpc } from '@/store/settingsSlice'

export type HeldRootsReader = (guardAddress: string, safeAddress: string, roots: string[]) => Promise<string[]>

/**
 * Reads which of the roots the guard still holds for a Safe, on chain. A failed read reports none, so the batch is
 * built as before and its simulation shows a root the guard rejects.
 */
export const useHeldRootsReader = (chainId: string | undefined): HeldRootsReader => {
  const chain = useChain(chainId ?? '')
  const customRpc = useAppSelector(selectRpc)[chainId ?? '']

  return useCallback(
    async (guardAddress, safeAddress, roots) => {
      if (!chain || roots.length === 0) return []
      try {
        const provider = await getReadOnlyProvider(chain, customRpc)
        if (!provider) return []
        // Loaded on use: its RPC error helpers pull contract ABIs that the always-loaded hooks must not
        const { readHeldRoots } = await import('../../services/readHeldRoots')
        return await readHeldRoots(provider, guardAddress, safeAddress, roots)
      } catch {
        return []
      }
    },
    [chain, customRpc],
  )
}
