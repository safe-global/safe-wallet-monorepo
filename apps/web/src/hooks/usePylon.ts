/**
 * Pylon Chat Integration Hook
 * 
 * This hook integrates Pylon support chat with Safe{Wallet} providing:
 * 1. Automatic user identification based on Safe address or EOA wallet
 * 2. Progressive email collection through chat interactions
 * 3. Rich context data for better support via custom fields
 * 
 * Email Collection Flow:
 * - Initially uses placeholder email: address@safewallet.com
 * - Detects real emails in chat messages via regex
 * - Stores email locally for persistence
 * - Passes email and context via custom fields to Pylon
 * 
 * Note: Contact updates must be handled by Pylon backend or support agents
 */
import { useEffect } from 'react'
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

// Configurable custom field mappings
// Update these field slugs to match your Pylon custom fields
const CUSTOM_FIELD_MAPPINGS = {
  // Contact identification fields
  contact_email: 'contact_email',              // For triggering contact updates
  contact_name: 'contact_name',                 // Contact display name
  contact_should_update: 'update_contact',      // Boolean flag for triggers
  
  // Context fields
  account_type: 'account_type',                 // 'safe' or 'eoa'
  primary_address: 'primary_address',           // Blockchain address
  chain_id: 'chain_id',                         // Network ID
  chain_name: 'chain_name',                     // Network name
  
  // Safe-specific fields (only populated for Safe accounts)
  safe_address: 'safe_address',
  safe_version: 'safe_version',
  safe_threshold: 'safe_threshold',
  safe_owners_count: 'safe_owners_count',
  is_safe_owner: 'is_safe_owner',
  
  // User preferences
  app_theme: 'app_theme',
  app_currency: 'app_currency',
  
  // Metadata
  email_detected_at: 'email_detected_at',       // ISO timestamp
  has_real_email: 'has_real_email',             // Boolean
}

// Email validation and extraction utilities
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi

const extractEmailFromText = (text: string): string | null => {
  if (!text || typeof text !== 'string') return null
  
  const matches = text.match(EMAIL_REGEX)
  if (!matches || matches.length === 0) return null
  
  // Filter out common non-email patterns and our placeholder emails
  const validEmails = matches.filter(email => {
    const lower = email.toLowerCase()
    return !lower.endsWith('@safewallet.com') && 
           !lower.endsWith('@example.com') &&
           !lower.includes('noreply') &&
           !lower.includes('no-reply') &&
           email.includes('.')
  })
  
  // Return the first valid email
  return validEmails.length > 0 ? validEmails[0].toLowerCase() : null
}

export const usePylon = () => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const wallet = useWallet()
  const settings = useAppSelector(selectSettings)
  const [userEmail, setUserEmail] = useLocalStorage<string>(PYLON_EMAIL_KEY)
  const currentChain = useCurrentChain()

  useEffect(() => {
    console.log('[Pylon] Hook triggered:', {
      hasPylon: !!window.Pylon,
      safeAddress,
      safe: !!safe,
      walletAddress: wallet?.address,
      userEmail,
      safeLoaded
    })
    
    // Set up message listener for email detection
    const handlePylonMessage = (event: MessageEvent) => {
      // Only process messages from Pylon widget
      if (!event.origin?.includes('pylon') && !event.origin?.includes('widget')) {
        return
      }
      
      console.log('[Pylon] Received message:', event.data)
      
      // Check various possible message structures
      const messageContent = event.data?.message || 
                            event.data?.text || 
                            event.data?.content ||
                            (typeof event.data === 'string' ? event.data : '')
      
      if (messageContent) {
        // Extract email patterns from the message
        const extractedEmail = extractEmailFromText(messageContent)
        
        if (extractedEmail && extractedEmail !== userEmail) {
          console.log('[Pylon] Email pattern detected in chat:', extractedEmail)
          setUserEmail(extractedEmail)
          
          // Update custom fields for future issues
          updatePylonCustomFields()
        }
      }
    }
    
    window.addEventListener('message', handlePylonMessage)
    
    // If Pylon is not loaded yet, wait for it
    if (!window.Pylon && (safeAddress || wallet?.address)) {
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
      
      return () => {
        clearInterval(checkPylon)
        window.removeEventListener('message', handlePylonMessage)
      }
    }
    
    // Only proceed if we have Pylon and either a safe address or wallet address
    if (!window.Pylon || (!safeAddress && !wallet?.address)) {
      console.log('[Pylon] Skipping update - missing dependencies')
      return () => {
        window.removeEventListener('message', handlePylonMessage)
      }
    }

    updatePylonSettings()
    
    function updatePylonSettings() {
      // Determine if we're using Safe or EOA
      const isSafeContext = !!safeAddress && !!safe
      const primaryAddress = isSafeContext ? safeAddress : wallet?.address || ''
      
      if (!primaryAddress) return
      
      const shortAddress = `${primaryAddress.slice(0, 6)}...${primaryAddress.slice(-4)}`
      
      // Determine the best email to use
      const email = userEmail || `${shortAddress}@safewallet.com`
      
      // Determine the display name
      let name: string
      if (isSafeContext) {
        name = `Safe ${shortAddress}`
      } else {
        name = `Wallet ${shortAddress}`
      }
      
      // Update the global pylon settings (for widget initialization)
      if (window.pylon?.chat_settings) {
        window.pylon.chat_settings = {
          ...window.pylon.chat_settings,
          email,
          name,
          account_id: primaryAddress,
          account_external_id: `${chainId}:${primaryAddress}`,
        }
      }

      // Update custom fields for new issues
      updatePylonCustomFields()
      
      console.log('[Pylon] Updated settings:', window.pylon?.chat_settings)
    }
    
    function updatePylonCustomFields() {
      if (!window.Pylon) return
      
      const isSafeContext = !!safeAddress && !!safe
      const primaryAddress = isSafeContext ? safeAddress : wallet?.address || ''
      const shortAddress = primaryAddress ? `${primaryAddress.slice(0, 6)}...${primaryAddress.slice(-4)}` : ''
      
      // Build custom fields using the configured mappings
      const customFields: Record<string, any> = {}
      
      // Contact identification fields (for backend to update contact)
      if (userEmail) {
        customFields[CUSTOM_FIELD_MAPPINGS.contact_email] = userEmail
        customFields[CUSTOM_FIELD_MAPPINGS.contact_should_update] = true
        customFields[CUSTOM_FIELD_MAPPINGS.email_detected_at] = new Date().toISOString()
      }
      
      // Set contact name based on context
      customFields[CUSTOM_FIELD_MAPPINGS.contact_name] = isSafeContext 
        ? `Safe ${shortAddress}` 
        : `Wallet ${shortAddress}`
      
      // Context fields
      customFields[CUSTOM_FIELD_MAPPINGS.account_type] = isSafeContext ? 'safe' : 'eoa'
      customFields[CUSTOM_FIELD_MAPPINGS.primary_address] = primaryAddress
      customFields[CUSTOM_FIELD_MAPPINGS.chain_id] = chainId
      customFields[CUSTOM_FIELD_MAPPINGS.chain_name] = currentChain?.chainName || 'Unknown'
      customFields[CUSTOM_FIELD_MAPPINGS.has_real_email] = !!userEmail
      
      // User preferences
      customFields[CUSTOM_FIELD_MAPPINGS.app_theme] = settings.theme.darkMode ? 'dark' : 'light'
      customFields[CUSTOM_FIELD_MAPPINGS.app_currency] = settings.currency
      
      // Add Safe-specific fields if in Safe context
      if (isSafeContext && safe) {
        customFields[CUSTOM_FIELD_MAPPINGS.safe_address] = safeAddress
        customFields[CUSTOM_FIELD_MAPPINGS.safe_version] = safe.version
        customFields[CUSTOM_FIELD_MAPPINGS.safe_threshold] = `${safe.threshold}/${safe.owners.length}`
        customFields[CUSTOM_FIELD_MAPPINGS.safe_owners_count] = safe.owners.length
        customFields[CUSTOM_FIELD_MAPPINGS.is_safe_owner] = safe.owners.some(owner => owner.value === wallet?.address)
      }
      
      // Use the actual Pylon API to set custom fields
      try {
        window.Pylon('setNewIssueCustomFields', customFields)
        console.log('[Pylon] Custom fields updated:', customFields)
      } catch (e) {
        console.error('[Pylon] Failed to set custom fields:', e)
      }
    }
    
    // Cleanup event listener
    return () => {
      window.removeEventListener('message', handlePylonMessage)
    }
  }, [safeAddress, chainId, safe, wallet, userEmail, settings, currentChain, safeLoaded])
  
  return {
    userEmail,
    setUserEmail,
    hasRealEmail: !!userEmail,
    isSafeContext: !!safeAddress && !!safe,
    currentAddress: safeAddress || wallet?.address || ''
  }
}

// Helper functions for debugging and interaction
export const pylonHelpers = {
  // Check if Pylon is loaded and ready
  isReady: () => {
    return !!(window.Pylon && window.pylon?.chat_settings?.app_id)
  },
  
  // Open the chat widget
  open: () => {
    if (window.Pylon) {
      window.Pylon('show')
    } else {
      console.error('[Pylon] Not loaded yet')
    }
  },
  
  // Close the chat widget
  close: () => {
    if (window.Pylon) {
      window.Pylon('hide')
    }
  },
  
  // Hide the chat bubble
  hideBubble: () => {
    if (window.Pylon) {
      window.Pylon('hideChatBubble')
    }
  },
  
  // Show the chat bubble
  showBubble: () => {
    if (window.Pylon) {
      window.Pylon('showChatBubble')
    }
  },
  
  // Get current settings
  getSettings: () => {
    return window.pylon?.chat_settings
  },
  
  // Show new message with pre-filled content
  showNewMessage: (message: string, isHtml: boolean = false) => {
    if (window.Pylon) {
      if (isHtml) {
        window.Pylon('showNewMessage', message, { isHtml: true })
      } else {
        window.Pylon('showNewMessage', message)
      }
    }
  },
  
  // Navigate to a specific ticket form
  showTicketForm: (formSlug: string) => {
    if (window.Pylon) {
      window.Pylon('showTicketForm', formSlug)
    }
  },
  
  // Update user email locally and refresh custom fields
  updateEmail: (email: string) => {
    // Store in localStorage for persistence
    const storage = window.localStorage
    if (storage) {
      storage.setItem('SAFE_v2__pylonUserEmail', JSON.stringify(email))
    }
    
    // Update custom fields with new email
    const currentSettings = window.pylon?.chat_settings
    if (currentSettings && window.Pylon) {
      currentSettings.email = email
      
      // Refresh custom fields to include new email
      window.location.reload() // Simplest way to ensure all hooks re-run with new email
    }
    
    console.log('[Pylon] Email manually updated:', email)
  },
  
  // Listen for unread message count changes
  onUnreadChange: (callback: (count: number) => void) => {
    if (window.Pylon) {
      window.Pylon('onChangeUnreadMessagesCount', callback)
    }
  },
  
  // Debug info
  debug: () => {
    console.log('[Pylon Debug Info]')
    console.log('- Pylon loaded:', !!window.Pylon)
    console.log('- Settings:', window.pylon?.chat_settings)
    console.log('- Widget iframe:', document.querySelector('iframe[id*="pylon"]'))
  }
}

// Make helpers available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).pylonHelpers = pylonHelpers
} 