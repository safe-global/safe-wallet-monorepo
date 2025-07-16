import { useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/router'
import useSafeInfo from '@/hooks/useSafeInfo'
import useChainId from '@/hooks/useChainId'
import useWallet from '@/hooks/wallets/useWallet'
import { useAppSelector } from '@/store'
import { selectSettings } from '@/store/settingsSlice'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { useCurrentChain } from '@/hooks/useChains'

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
    Pylon?: (command: string, ...args: any[]) => void
  }
}

const PYLON_EMAIL_KEY = 'pylonUserEmail'

// Custom field mappings - configure these to match your Pylon workspace
// Exact fields from your Pylon workspace
const FIELD_MAPPINGS = {
  // User identification
  primary_address: 'primary_address',
  chain_id: 'chain_id',
  contact_email: 'contact_email',
  
  // Safe-specific (only when in Safe context)
  safe_address: 'safe_address',
  safe_version: 'safe_version',
  safe_threshold: 'safe_threshold',
  safe_owners_count: 'safe_owners_count',
  is_safe_owner: 'is_safe_owner',
  
  // App context
  current_route: 'current_route',
  page_section: 'page_section',
  browser_url: 'browser_url',
  
  // Safe app context
  safe_app_name: 'safe_app_name',
} as const

// Helper functions
const formatAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

export const usePylon = () => {
  const { safe, safeAddress } = useSafeInfo()
  const chainId = useChainId()
  const wallet = useWallet()
  const [userEmail, setUserEmail] = useLocalStorage<string>(PYLON_EMAIL_KEY)
  const router = useRouter()
  
  // Compute user context
  const userContext = useMemo(() => {
    const isSafeContext = !!safeAddress && !!safe
    const eoaAddress = wallet?.address || ''
    const primaryAddress = eoaAddress  // Primary address is always the EOA (signer)
    const shortAddress = formatAddress(primaryAddress)
    const email = userEmail || `user-${primaryAddress.toLowerCase()}@safewallet.com`
    const contactName = isSafeContext ? `Safe ${formatAddress(safeAddress)}` : `Wallet ${shortAddress}`
    
    return {
      isSafeContext,
      primaryAddress,  // EOA address
      eoaAddress,      // Same as primaryAddress, but explicit
      shortAddress,
      email,
      contactName,
      isValid: validateAddress(primaryAddress)
    }
  }, [safeAddress, safe, wallet?.address, userEmail])


  // Track if we've already initialized Pylon for this session
  const initializePylon = useCallback(() => {
    if (!userContext.isValid) return
    
    // Add delay to ensure wallet and Safe info are fully loaded
    const initDelay = setTimeout(() => {
      // Wait for Pylon to load (max 10 seconds)
      let checkCount = 0
      const maxChecks = 100
      
      const tryUpdate = () => {
        if (!window.Pylon) {
          if (checkCount++ < maxChecks) {
            setTimeout(tryUpdate, 100)
          } else {
            console.error('[Pylon] Timeout waiting for Pylon to load after 10 seconds')
          }
          return
        }
        
        // Additional check to ensure Pylon is fully initialized
        if (!window.pylon?.chat_settings?.app_id) {
          console.warn('[Pylon] Pylon loaded but chat_settings not initialized yet')
          if (checkCount++ < maxChecks) {
            setTimeout(tryUpdate, 100)
          }
          return
        }
        
        console.log('[Pylon] Pylon fully loaded and ready - initializing for session')
      
        // Update chat settings
        if (window.pylon?.chat_settings) {
          window.pylon.chat_settings = {
            ...window.pylon.chat_settings,
            email: userContext.email,
            name: userContext.contactName,
            account_id: userContext.primaryAddress.toLowerCase(),
            account_external_id: `${chainId}:${userContext.primaryAddress.toLowerCase()}`,
          }
        }
        
        // Apply settings
        try {
          window.Pylon('update')
          
          // Set custom fields for new issues - capture initial context
          const customFields = (() => {
            const fields: Record<string, any> = {}
            
            // Basic context - capture once
            fields[FIELD_MAPPINGS.primary_address] = userContext.primaryAddress  // EOA address (signer)
            fields[FIELD_MAPPINGS.chain_id] = chainId.toString()
            fields[FIELD_MAPPINGS.contact_email] = userContext.email
            
            // Safe-specific fields - capture once
            if (userContext.isSafeContext && safe && safeAddress) {
              fields[FIELD_MAPPINGS.safe_address] = safeAddress  // Safe address (different from EOA)
              fields[FIELD_MAPPINGS.safe_version] = safe.version
              fields[FIELD_MAPPINGS.safe_threshold] = `${safe.threshold}/${safe.owners.length}`
              fields[FIELD_MAPPINGS.safe_owners_count] = safe.owners.length.toString()
              fields[FIELD_MAPPINGS.is_safe_owner] = safe.owners.some(owner => owner.value === userContext.primaryAddress) ? 'true' : 'false'
            }
            
            // Capture initial page context
            const pageSection = router.pathname.split('/')[1] || 'home'
            fields[FIELD_MAPPINGS.current_route] = router.pathname
            fields[FIELD_MAPPINGS.page_section] = pageSection
            
            // Browser URL for initial context
            if (typeof window !== 'undefined') {
              fields[FIELD_MAPPINGS.browser_url] = window.location.href
            }
            
            // Safe app context if present at initialization
            const safeAppUrl = router.query.appUrl?.toString()
            if (safeAppUrl) {
              try {
                fields[FIELD_MAPPINGS.safe_app_name] = new URL(safeAppUrl).hostname
              } catch {
                fields[FIELD_MAPPINGS.safe_app_name] = 'Unknown Safe App'
              }
            }
            
            return fields
          })()
          
          console.log('[Pylon] Setting initial custom fields:', customFields)
          console.log('[Pylon] Custom fields keys:', Object.keys(customFields))
          
          // Try setting custom fields with error handling
          try {
            window.Pylon('setNewIssueCustomFields', customFields)
            console.log('[Pylon] Initial custom fields set successfully')
            
            // Verify by trying to get current settings (if available)
            if (window.pylon?.chat_settings) {
              console.log('[Pylon] Current chat_settings:', window.pylon.chat_settings)
            }
          } catch (fieldError) {
            console.error('[Pylon] Failed to set custom fields:', fieldError)
            console.error('[Pylon] This might mean custom fields are not configured in your Pylon workspace')
            console.error('[Pylon] Make sure to create these custom fields in Pylon with the correct slugs:', Object.keys(customFields))
          }
        } catch (error) {
          console.error('[Pylon] Failed to update:', error)
        }
      }
      
      tryUpdate()
    }, 1500) // 1.5 second delay to let wallet/Safe info load first
    
    return () => {
      clearTimeout(initDelay)
    }
  }, [userContext, chainId, safe, safeAddress, wallet?.address, router.pathname, router.query.appUrl])

  // Initialize Pylon once when user context becomes valid
  useEffect(() => {
    if (!userContext.isValid) return
    
    console.log('[Pylon] User context is valid, initializing Pylon for this session')
    const cleanup = initializePylon()
    
    return cleanup
  }, [userContext.isValid, userContext.primaryAddress, userContext.isSafeContext, initializePylon])
  
  // Add event listener for manual refresh
  useEffect(() => {
    const handleRefresh = () => {
      if (userContext.isValid && window.Pylon) {
        console.log('[Pylon] Manual refresh triggered - re-initializing')
        const cleanup = initializePylon()
        // Clean up the timeout if needed
        if (cleanup) {
          setTimeout(cleanup, 100)
        }
      }
    }
    
    window.addEventListener('pylon-refresh-fields', handleRefresh)
    return () => window.removeEventListener('pylon-refresh-fields', handleRefresh)
  }, [userContext.isValid, initializePylon])
  
  return {
    userEmail,
    setUserEmail,
    hasRealEmail: !!userEmail,
    isSafeContext: userContext.isSafeContext,
    currentAddress: userContext.primaryAddress
  }
}

// Simple helper functions for common operations
export const pylonHelpers = {
  isReady: () => !!(window.Pylon && window.pylon?.chat_settings?.app_id),
  
  open: () => window.Pylon?.('show'),
  close: () => window.Pylon?.('hide'),
  hideBubble: () => window.Pylon?.('hideChatBubble'),
  showBubble: () => window.Pylon?.('showChatBubble'),
  
  showNewMessage: (message: string, isHtml = false) => {
    window.Pylon?.('showNewMessage', message, isHtml ? { isHtml: true } : undefined)
  },
  
  showTicketForm: (formSlug: string) => {
    window.Pylon?.('showTicketForm', formSlug)
  },
  
  onUnreadChange: (callback: (count: number) => void) => {
    window.Pylon?.('onChangeUnreadMessagesCount', callback)
  },
  
  // Update custom fields for new issues
  setCustomFields: (fields: Record<string, any>) => {
    console.log('[Pylon] Manually setting custom fields:', fields)
    try {
      window.Pylon?.('setNewIssueCustomFields', fields)
      console.log('[Pylon] Manual setCustomFields - success')
    } catch (error) {
      console.error('[Pylon] Manual setCustomFields - failed:', error)
      console.error('[Pylon] Make sure these custom fields exist in your Pylon workspace:', Object.keys(fields))
    }
  },
  
  // Refresh user context
  refresh: () => window.Pylon?.('update'),
  
  // Force refresh custom fields - useful for debugging
  refreshCustomFields: () => {
    if (!window.Pylon) return false
    
    try {
      // Get current context to rebuild fields
      const event = new CustomEvent('pylon-refresh-fields')
      window.dispatchEvent(event)
      return true
    } catch (error) {
      console.error('[Pylon] Failed to refresh custom fields:', error)
      return false
    }
  },
  
  // Test function to verify custom fields are working
  testCustomFields: () => {
    if (!window.Pylon) {
      console.error('[Pylon] Pylon not loaded')
      return false
    }
    
    const testFields = {
      test_field: 'test_value_' + Date.now()
    }
    
    console.log('[Pylon] Testing custom fields with:', testFields)
    
    try {
      window.Pylon('setNewIssueCustomFields', testFields)
      console.log('[Pylon] Test custom fields set successfully')
      console.log('[Pylon] Note: For this to work, you need a custom field with slug "test_field" in your Pylon workspace')
      return true
    } catch (error) {
      console.error('[Pylon] Test custom fields failed:', error)
      return false
    }
  },
}

// Make helpers available in console for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).pylonHelpers = pylonHelpers
}