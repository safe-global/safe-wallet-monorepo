import { useEffect } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChains from '@/hooks/useChains'
import { useNetworksOfSafe } from '@/hooks/useNetworksOfSafe'
import { safeAnalytics } from '@/services/analytics'
import { IS_PRODUCTION } from '@/config/constants'

/**
 * Hook to track Safe user properties for Mixpanel cohort analysis
 * Automatically updates user properties when Safe info changes
 */
export const useSafeUserProperties = () => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const { configs } = useChains()
  const networks = useNetworksOfSafe(safeAddress)

  useEffect(() => {
    if (!safeLoaded || !safeAddress || !safe.chainId || networks.length === 0) {
      return
    }

    try {
      const currentChain = configs.find((c) => c.chainId === safe.chainId)
      const chainName = currentChain?.chainName || 'Unknown'

      safeAnalytics.setSafeUserProperties(safeAddress, safe, chainName, networks)

      if (!IS_PRODUCTION) {
        console.info('[Analytics] Safe user properties updated:', {
          safeAddress,
          chainName,
          networks,
          owners: safe.owners?.length,
          threshold: safe.threshold,
          nonce: safe.nonce,
          version: safe.version,
        })
      }
    } catch (error) {
      console.error('[Analytics] Failed to set Safe user properties:', error)
    }
  }, [safeAddress, safe, safeLoaded, networks, configs])

  // Update transaction count when nonce changes
  useEffect(() => {
    if (!safeLoaded || !safeAddress || !safe.chainId || typeof safe.nonce !== 'number') {
      return
    }

    try {
      const currentChain = configs.find((c) => c.chainId === safe.chainId)
      const chainName = currentChain?.chainName || 'Unknown'

      safeAnalytics.updateSafeTransactionCount(safe.nonce, chainName)

      if (!IS_PRODUCTION) {
        console.info('[Analytics] Transaction count updated:', {
          safeAddress,
          chainName,
          nonce: safe.nonce,
        })
      }
    } catch (error) {
      console.error('[Analytics] Failed to update transaction count:', error)
    }
  }, [safe.nonce, safeAddress, safe.chainId, safeLoaded, configs])

  // Update threshold when it changes
  useEffect(() => {
    if (!safeLoaded || !safeAddress || !safe.chainId || typeof safe.threshold !== 'number') {
      return
    }

    try {
      const currentChain = configs.find((c) => c.chainId === safe.chainId)
      const chainName = currentChain?.chainName || 'Unknown'

      safeAnalytics.updateSafeThreshold(safe.threshold, chainName)

      if (!IS_PRODUCTION) {
        console.info('[Analytics] Threshold updated:', {
          safeAddress,
          chainName,
          threshold: safe.threshold,
        })
      }
    } catch (error) {
      console.error('[Analytics] Failed to update threshold:', error)
    }
  }, [safe.threshold, safeAddress, safe.chainId, safeLoaded, configs])

  // Update signer count when owners change
  useEffect(() => {
    if (!safeLoaded || !safeAddress || !safe.chainId || !safe.owners?.length) {
      return
    }

    try {
      const currentChain = configs.find((c) => c.chainId === safe.chainId)
      const chainName = currentChain?.chainName || 'Unknown'

      safeAnalytics.updateSafeSigners(safe.owners.length, chainName)

      if (!IS_PRODUCTION) {
        console.info('[Analytics] Signer count updated:', {
          safeAddress,
          chainName,
          signerCount: safe.owners.length,
        })
      }
    } catch (error) {
      console.error('[Analytics] Failed to update signer count:', error)
    }
  }, [safe.owners?.length, safeAddress, safe.chainId, safeLoaded, configs])

  // Update networks when they change
  useEffect(() => {
    if (networks.length === 0) {
      return
    }

    try {
      safeAnalytics.addSafeNetwork(networks)

      if (!IS_PRODUCTION) {
        console.info('[Analytics] Networks updated:', { networks })
      }
    } catch (error) {
      console.error('[Analytics] Failed to update networks:', error)
    }
  }, [networks])

  return null
}
