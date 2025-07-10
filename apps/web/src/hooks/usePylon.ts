/**
 * Pylon Chat Integration Hook
 * 
 * This hook integrates Pylon support chat with Safe{Wallet} providing:
 * 1. Automatic user identification based on Safe address or EOA wallet
 * 2. Rich context data for better support via custom fields
 * 3. Page context data for better support
 * 4. API helpers for updating custom fields during chat sessions
 * 
 * API Configuration:
 * - Set NEXT_PUBLIC_PYLON_API_KEY environment variable for REST API calls
 * - JavaScript Widget API works automatically when Pylon script is loaded
 * 
 * Usage:
 * - Initial fields are set automatically when chat widget loads
 * - Use pylonHelpers for manual updates during support sessions
 */
import { useEffect, useMemo } from 'react'
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

// Security configurations
const SECURITY_CONFIG = {
  // Rate limiting
  maxCallsPerMinute: 10,
  
  // Allowed custom fields for frontend updates (security restriction)
  allowedFields: [
    'detected_email',
    'transaction_hash', 
    'mentioned_address',
    'issue_type',
    'issue_keywords'
  ] as const,
  
  // Environment checks
  enableApiCalls: process.env.NEXT_PUBLIC_ENABLE_PYLON_API_CALLS !== 'false',
  isDevelopment: process.env.NODE_ENV === 'development'
}

// Simple rate limiter for frontend API calls
const rateLimiter = {
  calls: 0,
  resetTime: Date.now() + 60000,
  
  canMakeCall(): boolean {
    if (Date.now() > this.resetTime) {
      this.calls = 0
      this.resetTime = Date.now() + 60000
    }
    
    if (this.calls >= SECURITY_CONFIG.maxCallsPerMinute) {
      console.warn('[Pylon Security] Rate limit exceeded. Please wait before making more API calls.')
      return false
    }
    
    this.calls++
    return true
  },
  
  getRemainingCalls(): number {
    return Math.max(0, SECURITY_CONFIG.maxCallsPerMinute - this.calls)
  }
}

// Validate that custom fields are allowed for frontend updates
const validateAllowedFields = (customFields: Record<string, any>): boolean => {
  const fieldKeys = Object.keys(customFields)
  const allowedFields = SECURITY_CONFIG.allowedFields as readonly string[]
  
  for (const key of fieldKeys) {
    if (!allowedFields.includes(key)) {
      console.error(`[Pylon Security] Field '${key}' is not allowed for frontend updates. Allowed fields:`, allowedFields)
      return false
    }
  }
  return true
}

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
  
  // Page Context fields
  current_route: 'current_route',                // e.g. "/transactions/history"
  page_section: 'page_section',                  // e.g. "transactions", "settings"
  page_title: 'page_title',                      // Document title
  safe_app_url: 'safe_app_url',                  // Safe app URL if applicable
  safe_app_name: 'safe_app_name',                // App domain/name
  browser_url: 'browser_url',                    // Full URL for debugging
  query_params: 'query_params',                  // URL parameters as JSON string
  
  // Dynamic fields from backend chat analysis (set via API webhooks)
  detected_email: 'detected_email',              // Email extracted from chat
  transaction_hash: 'transaction_hash',          // Transaction hash mentioned
  mentioned_address: 'mentioned_address',        // Address mentioned in chat
  issue_type: 'issue_type',                      // Type of issue (error_report, etc.)
  issue_keywords: 'issue_keywords',              // Keywords found in message
  
}

// Helper functions for validation and formatting
const validateAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address)
}

const formatShortAddress = (address: string): string => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

const generateContactName = (isSafeContext: boolean, shortAddress: string): string => {
  return isSafeContext ? `Safe ${shortAddress}` : `Wallet ${shortAddress}`
}

// Context computation hook - memoized to prevent recalculation
const useUserContext = (safeAddress: string | undefined, safe: any, wallet: any, userEmail: string | undefined, chainId: string) => {
  return useMemo(() => {
    const isSafeContext = !!safeAddress && !!safe
    const primaryAddress = isSafeContext ? safeAddress : wallet?.address || ''
    const shortAddress = formatShortAddress(primaryAddress)
    const email = userEmail || `user-${primaryAddress.toLowerCase()}@safewallet.com`
    const contactName = generateContactName(isSafeContext, shortAddress)
    
    return {
      isSafeContext,
      primaryAddress,
      shortAddress,
      email,
      contactName,
      isValid: validateAddress(primaryAddress)
    }
  }, [safeAddress, safe, wallet?.address, userEmail, chainId])
}

export const usePylon = () => {
  const { safe, safeAddress, safeLoaded } = useSafeInfo()
  const chainId = useChainId()
  const wallet = useWallet()
  const settings = useAppSelector(selectSettings)
  const [userEmail, setUserEmail] = useLocalStorage<string>(PYLON_EMAIL_KEY)
  const currentChain = useCurrentChain()
  const router = useRouter()
  
  // Memoized user context to prevent unnecessary recalculations
  const userContext = useUserContext(safeAddress, safe, wallet, userEmail, chainId)

  useEffect(() => {
    // If Pylon is not loaded yet, wait for it
    if (!window.Pylon && (safeAddress || wallet?.address)) {
      const checkPylon = setInterval(() => {
        if (window.Pylon) {
          clearInterval(checkPylon)
          updatePylonSettings()
        }
      }, 100)
      
      // Clean up after 10 seconds
      setTimeout(() => {
        clearInterval(checkPylon)
      }, 10000)
      
      return () => {
        clearInterval(checkPylon)
      }
    }
    
    // Only proceed if we have Pylon and valid user context
    if (!window.Pylon || !userContext.isValid) {
      return
    }

    updatePylonSettings()
    
    function updatePylonSettings() {
      if (!userContext.isValid) {
        console.error('[Pylon] Invalid user context:', userContext)
        return
      }
      
      // Create clean parameters
      const pylonParams = {
        email: userContext.email.trim(),
        name: userContext.contactName.trim(),
        account_id: userContext.primaryAddress.toLowerCase(),
        account_external_id: `${chainId}:${userContext.primaryAddress.toLowerCase()}`,
      }
      
      // Update the global pylon settings (for widget initialization)
      if (window.pylon?.chat_settings) {
        window.pylon.chat_settings = {
          ...window.pylon.chat_settings,
          ...pylonParams
        }
      }

      // ⚠️ CRITICAL: Tell Pylon to apply the new settings
      if (window.Pylon) {
        try {
          window.Pylon('update')
        } catch (error) {
          console.error('[Pylon] Failed to update:', error)
        }
      }

      // Update custom fields for new issues
      updatePylonCustomFields()
    }
    
    function updatePylonCustomFields() {
      if (!window.Pylon || !userContext.isValid) return
      
      // Build custom fields using the configured mappings
      const customFields: Record<string, any> = {}
      
      // Contact identification fields (for backend to update contact)
      if (userEmail) {
        customFields[CUSTOM_FIELD_MAPPINGS.contact_email] = userEmail
        customFields[CUSTOM_FIELD_MAPPINGS.contact_should_update] = true
      }
      
      // Set contact name based on context
      customFields[CUSTOM_FIELD_MAPPINGS.contact_name] = userContext.contactName
      
      // Context fields
      customFields[CUSTOM_FIELD_MAPPINGS.account_type] = userContext.isSafeContext ? 'safe' : 'eoa'
      customFields[CUSTOM_FIELD_MAPPINGS.primary_address] = userContext.primaryAddress
      customFields[CUSTOM_FIELD_MAPPINGS.chain_id] = chainId
      customFields[CUSTOM_FIELD_MAPPINGS.chain_name] = currentChain?.chainName || 'Unknown'
      
      // User preferences
      customFields[CUSTOM_FIELD_MAPPINGS.app_theme] = settings.theme.darkMode ? 'dark' : 'light'
      customFields[CUSTOM_FIELD_MAPPINGS.app_currency] = settings.currency
      
      // Add Safe-specific fields if in Safe context
      if (userContext.isSafeContext && safe) {
        customFields[CUSTOM_FIELD_MAPPINGS.safe_address] = safeAddress
        customFields[CUSTOM_FIELD_MAPPINGS.safe_version] = safe.version
        customFields[CUSTOM_FIELD_MAPPINGS.safe_threshold] = `${safe.threshold}/${safe.owners.length}`
        customFields[CUSTOM_FIELD_MAPPINGS.safe_owners_count] = safe.owners.length
        customFields[CUSTOM_FIELD_MAPPINGS.is_safe_owner] = safe.owners.some(owner => owner.value === wallet?.address)
      }
      
      // Page Context Fields - capture what screen/app user was on
      const pageSection = router.pathname.split('/')[1] || 'home' // First path segment
      const safeAppUrl = router.query.appUrl?.toString()
      
      customFields[CUSTOM_FIELD_MAPPINGS.current_route] = router.pathname
      customFields[CUSTOM_FIELD_MAPPINGS.page_section] = pageSection
      customFields[CUSTOM_FIELD_MAPPINGS.query_params] = JSON.stringify(router.query)
      
      // Only access DOM when needed (performance optimization)
      if (typeof document !== 'undefined') {
        customFields[CUSTOM_FIELD_MAPPINGS.page_title] = document.title
      }
      if (typeof window !== 'undefined') {
        customFields[CUSTOM_FIELD_MAPPINGS.browser_url] = window.location.href
      }
      
      // Safe App Context (if in Safe app)
      if (safeAppUrl) {
        customFields[CUSTOM_FIELD_MAPPINGS.safe_app_url] = safeAppUrl
        try {
          const appDomain = new URL(safeAppUrl).hostname
          customFields[CUSTOM_FIELD_MAPPINGS.safe_app_name] = appDomain
        } catch (e) {
          customFields[CUSTOM_FIELD_MAPPINGS.safe_app_name] = 'Unknown Safe App'
        }
      }
      
      // Set custom fields for new issues using Pylon's JavaScript API
      try {
        window.Pylon('setNewIssueCustomFields', customFields)
        console.log('[Pylon] New issue custom fields set:', customFields)
      } catch (e) {
        console.error('[Pylon] Failed to set new issue custom fields:', e)
      }
    }

  }, [safeAddress, chainId, safe, wallet, userEmail, settings, currentChain, safeLoaded, router.pathname, router.query, userContext])
  
  return {
    userEmail,
    setUserEmail,
    hasRealEmail: !!userEmail,
    isSafeContext: userContext.isSafeContext,
    currentAddress: userContext.primaryAddress
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

  // Listen for unread message count changes
  onUnreadChange: (callback: (count: number) => void) => {
    if (window.Pylon) {
      window.Pylon('onChangeUnreadMessagesCount', callback)
    }
  },
  
  // Set custom fields for new issues (JavaScript API)
  setNewIssueFields: (newFields: Record<string, any>) => {
    if (window.Pylon) {
      try {
        window.Pylon('setNewIssueCustomFields', newFields)
        console.log('[Pylon] New issue custom fields set:', newFields)
      } catch (e) {
        console.error('[Pylon] Failed to set new issue custom fields:', e)
      }
    }
  },

  // Update existing issue via REST API (with security checks)
  updateIssueFields: async (issueId: string, customFields: Record<string, any>, apiKey?: string) => {
    // Security checks
    if (!SECURITY_CONFIG.enableApiCalls) {
      const message = '[Pylon Security] API calls are disabled via environment configuration'
      console.warn(message)
      throw new Error(message)
    }
    
    if (!rateLimiter.canMakeCall()) {
      const message = `[Pylon Security] Rate limit exceeded. ${rateLimiter.getRemainingCalls()} calls remaining this minute.`
      throw new Error(message)
    }
    
    if (!validateAllowedFields(customFields)) {
      throw new Error('[Pylon Security] Contains restricted fields. Update rejected.')
    }
    
    if (!issueId || typeof issueId !== 'string') {
      throw new Error('[Pylon Security] Invalid issue ID provided')
    }
    
    try {
      const apiKeyToUse = apiKey || process.env.NEXT_PUBLIC_PYLON_API_KEY
      if (!apiKeyToUse) {
        throw new Error('[Pylon Security] No API key available. Please provide one or set NEXT_PUBLIC_PYLON_API_KEY')
      }
      
      console.log('[Pylon Security] Making authenticated API call:', { issueId, fields: Object.keys(customFields) })
      
      const response = await fetch(`https://api.usepylon.com/issues/${issueId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyToUse}`
        },
        body: JSON.stringify({
          custom_fields: customFields
        })
      })
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('[Pylon] Issue updated via API:', result)
      return result
    } catch (e) {
      console.error('[Pylon] Failed to update issue via API:', e)
      throw e
    }
  },

  // Update contact via REST API (with security checks)
  updateContactFields: async (contactId: string, customFields: Record<string, any>, apiKey?: string) => {
    // Security checks (same as updateIssueFields)
    if (!SECURITY_CONFIG.enableApiCalls) {
      const message = '[Pylon Security] API calls are disabled via environment configuration'
      console.warn(message)
      throw new Error(message)
    }
    
    if (!rateLimiter.canMakeCall()) {
      const message = `[Pylon Security] Rate limit exceeded. ${rateLimiter.getRemainingCalls()} calls remaining this minute.`
      throw new Error(message)
    }
    
    if (!validateAllowedFields(customFields)) {
      throw new Error('[Pylon Security] Contains restricted fields. Update rejected.')
    }
    
    if (!contactId || typeof contactId !== 'string') {
      throw new Error('[Pylon Security] Invalid contact ID provided')
    }
    
    try {
      const apiKeyToUse = apiKey || process.env.NEXT_PUBLIC_PYLON_API_KEY
      if (!apiKeyToUse) {
        throw new Error('[Pylon Security] No API key available. Please provide one or set NEXT_PUBLIC_PYLON_API_KEY')
      }
      
      console.log('[Pylon Security] Making authenticated API call:', { contactId, fields: Object.keys(customFields) })
      
      const response = await fetch(`https://api.usepylon.com/contacts/${contactId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyToUse}`
        },
        body: JSON.stringify({
          custom_fields: customFields
        })
      })
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`)
      }
      
      const result = await response.json()
      console.log('[Pylon] Contact updated via API:', result)
      return result
    } catch (e) {
      console.error('[Pylon] Failed to update contact via API:', e)
      throw e
    }
  },

  // Security status and configuration helpers
  getSecurityStatus: () => {
    return {
      apiCallsEnabled: SECURITY_CONFIG.enableApiCalls,
      isDevelopment: SECURITY_CONFIG.isDevelopment,
      remainingCalls: rateLimiter.getRemainingCalls(),
      maxCallsPerMinute: SECURITY_CONFIG.maxCallsPerMinute,
      allowedFields: SECURITY_CONFIG.allowedFields,
      hasApiKey: !!(process.env.NEXT_PUBLIC_PYLON_API_KEY)
    }
  },

  // Check if a specific field is allowed for updates
  isFieldAllowed: (fieldName: string) => {
    return SECURITY_CONFIG.allowedFields.includes(fieldName as any)
  },

  // Get current issue ID (if available in widget)
  getCurrentIssueId: () => {
    // This might need to be implemented based on Pylon's widget API
    // or extracted from the widget's iframe/DOM
    const pylonIframe = document.querySelector('iframe[id*="pylon"]') as HTMLIFrameElement
    if (pylonIframe) {
      // Try to extract issue ID from iframe URL or other methods
      console.log('[Pylon] Widget iframe found, but issue ID extraction needs implementation')
    }
    return null
  },
  
  // Quick helpers for common support scenarios (uses both APIs)
  markAsTransactionIssue: async (txHash?: string, issueId?: string, apiKey?: string) => {
    const fields: Record<string, any> = {
      [CUSTOM_FIELD_MAPPINGS.issue_type]: 'transaction_issue'
    }
    if (txHash) {
      fields[CUSTOM_FIELD_MAPPINGS.transaction_hash] = txHash
    }
    
    // Set for new issues
    pylonHelpers.setNewIssueFields(fields)
    
    // Update existing issue if ID provided
    if (issueId) {
      try {
        await pylonHelpers.updateIssueFields(issueId, fields, apiKey)
      } catch (e) {
        console.error('[Pylon] Failed to update existing issue:', e)
      }
    }
  },
  
  markAsWalletConnectionIssue: async (issueId?: string, apiKey?: string) => {
    const fields = {
      [CUSTOM_FIELD_MAPPINGS.issue_type]: 'wallet_connection'
    }
    
    pylonHelpers.setNewIssueFields(fields)
    
    if (issueId) {
      try {
        await pylonHelpers.updateIssueFields(issueId, fields, apiKey)
      } catch (e) {
        console.error('[Pylon] Failed to update existing issue:', e)
      }
    }
  },
  
  addUserEmail: async (email: string, contactId?: string, issueId?: string, apiKey?: string) => {
    const fields = {
      [CUSTOM_FIELD_MAPPINGS.detected_email]: email
    }
    
    // Set for new issues
    pylonHelpers.setNewIssueFields(fields)
    
    // Update existing contact if ID provided
    if (contactId) {
      try {
        await pylonHelpers.updateContactFields(contactId, fields, apiKey)
      } catch (e) {
        console.error('[Pylon] Failed to update contact:', e)
      }
    }
    
    // Update existing issue if ID provided
    if (issueId) {
      try {
        await pylonHelpers.updateIssueFields(issueId, fields, apiKey)
      } catch (e) {
        console.error('[Pylon] Failed to update issue:', e)
      }
    }
  },

  // Get all current context fields (useful for API updates)
  getCurrentContextFields: () => {
    // This function builds the same custom fields that are set initially
    // You can use this to get fresh context data for API updates
    const router = typeof window !== 'undefined' ? window?.router : null
    const customFields: Record<string, any> = {}
    
    // Note: This would need access to the hook's state/context
    // For now, it returns the field mappings - you'd call this from the component
    // that has access to the full context data
    
    console.log('[Pylon] Available field mappings:', CUSTOM_FIELD_MAPPINGS)
    return CUSTOM_FIELD_MAPPINGS
  },

  // Helper to update issue with current page context
  updateIssueWithCurrentContext: async (issueId: string, apiKey?: string) => {
    const currentContext = {
      [CUSTOM_FIELD_MAPPINGS.current_route]: window.location.pathname,
      [CUSTOM_FIELD_MAPPINGS.page_title]: document.title,
      [CUSTOM_FIELD_MAPPINGS.browser_url]: window.location.href,
      [CUSTOM_FIELD_MAPPINGS.page_section]: window.location.pathname.split('/')[1] || 'home'
    }
    
    try {
      await pylonHelpers.updateIssueFields(issueId, currentContext, apiKey)
      console.log('[Pylon] Issue updated with current context')
    } catch (e) {
      console.error('[Pylon] Failed to update issue with current context:', e)
    }
  },
  
  // Force user context refresh
  refreshContext: () => {
    if (window.Pylon && window.pylon?.chat_settings) {
      console.log('[Pylon] Forcing context refresh...')
      window.Pylon('update')
      console.log('[Pylon] Context refreshed for:', window.pylon.chat_settings)
    }
  },

  // Switch to a specific user context (for testing)
  switchUser: (address: string, email?: string) => {
    if (!window.pylon?.chat_settings) return
    
    const shortAddress = formatShortAddress(address)
    
    window.pylon.chat_settings = {
      ...window.pylon.chat_settings,
      email: email || `${shortAddress}@safewallet.com`,
      name: `Test User ${shortAddress}`,
      account_id: address,
      account_external_id: `1:${address}`, // Default to mainnet
    }
    
    if (window.Pylon) {
      window.Pylon('update')
    }
    
    console.log('[Pylon] Switched to test user:', window.pylon.chat_settings)
  },

  // Debug info (includes security status)
  debug: () => {
    console.log('[Pylon Debug Info]')
    console.log('- Pylon loaded:', !!window.Pylon)
    console.log('- Settings:', window.pylon?.chat_settings)
    console.log('- Widget iframe:', document.querySelector('iframe[id*="pylon"]'))
    console.log('- Security status:', pylonHelpers.getSecurityStatus())
    console.log('- Environment:', {
      NODE_ENV: process.env.NODE_ENV,
      ENABLE_API_CALLS: process.env.NEXT_PUBLIC_ENABLE_PYLON_API_CALLS,
      HAS_API_KEY: !!process.env.NEXT_PUBLIC_PYLON_API_KEY
    })
  }
}

// Make helpers available in console for debugging
if (typeof window !== 'undefined') {
  (window as any).pylonHelpers = pylonHelpers
} 