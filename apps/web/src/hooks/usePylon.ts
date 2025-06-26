import { useEffect } from 'react'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'

declare global {
  interface Window {
    pylon?: {
      chat_settings: {
        app_id: string
        email?: string
        name?: string
        account_id?: string
        account_external_id?: string
      }
    }
    Pylon?: (command: string) => void
  }
}

export const usePylon = () => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const wallet = useWallet()

  useEffect(() => {
    console.log('[Pylon] Hook triggered:', {
      hasPylon: !!window.Pylon,
      safeAddress,
      safe: !!safe,
      walletAddress: wallet?.address
    })
    
    // If Pylon is not loaded yet, wait for it
    if (!window.Pylon && safeAddress && safe) {
      console.log('[Pylon] Waiting for Pylon to load...')
      
      const checkPylon = setInterval(() => {
        if (window.Pylon) {
          console.log('[Pylon] Pylon loaded, updating settings')
          clearInterval(checkPylon)
          updatePylonSettings()
        }
      }, 100)
      
      // Clean up after 10 seconds
      setTimeout(() => {
        clearInterval(checkPylon)
        console.error('[Pylon] Timeout waiting for Pylon to load')
      }, 10000)
      
      return () => clearInterval(checkPylon)
    }
    
    // Only proceed if we have the Pylon global and a safe address
    if (!window.Pylon || !safeAddress || !safe) {
      console.log('[Pylon] Skipping update - missing dependencies')
      return
    }

    updatePylonSettings()
    
    function updatePylonSettings() {
      // Update Pylon settings with current context
      const walletShortAddress = wallet?.address 
        ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` 
        : ''
      const safeShortAddress = `${safeAddress.slice(0, 6)}...${safeAddress.slice(-4)}`
      
      // Update the global pylon settings
      if (window.pylon?.chat_settings) {
        window.pylon.chat_settings = {
          ...window.pylon.chat_settings,
          email: walletShortAddress ? `${walletShortAddress}@safewallet.com` : `${safeShortAddress}@safewallet.com`,
          name: `Safe ${safeShortAddress}`,
          account_id: safeAddress,
          account_external_id: `${chainId}:${safeAddress}`,
        }
      }

      // Tell Pylon to update with new settings
      if (window.Pylon) {
        window.Pylon('update')
      }
      
      console.log('[Pylon] Updated settings:', window.pylon?.chat_settings)
    }
  }, [safeAddress, chainId, safe, wallet?.address])
}

// Helper functions for debugging
export const pylonHelpers = {
  // Check if Pylon is loaded and ready
  isReady: () => {
    return !!(window.Pylon && window.pylon?.chat_settings?.app_id)
  },
  
  // Open the chat widget
  open: () => {
    if (window.Pylon) {
      window.Pylon('show')
      window.Pylon('open')
    } else {
      console.error('[Pylon] Not loaded yet')
    }
  },
  
  // Close the chat widget
  close: () => {
    if (window.Pylon) {
      window.Pylon('close')
    }
  },
  
  // Hide the chat widget
  hide: () => {
    if (window.Pylon) {
      window.Pylon('hide')
    }
  },
  
  // Show the chat widget
  show: () => {
    if (window.Pylon) {
      window.Pylon('show')
    }
  },
  
  // Get current settings
  getSettings: () => {
    return window.pylon?.chat_settings
  },
  
  // Debug info
  debug: () => {
    console.log('[Pylon Debug Info]')
    console.log('- Pylon loaded:', !!window.Pylon)
    console.log('- Settings:', window.pylon?.chat_settings)
    console.log('- Iframe:', document.getElementById('pylon-frame'))
  }
}

// Make helpers available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).pylonHelpers = pylonHelpers
} 