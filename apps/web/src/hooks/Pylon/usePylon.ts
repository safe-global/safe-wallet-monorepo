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
const FIELD_MAPPINGS = {
  // User identification
  account_type: 'account_type',
  primary_address: 'primary_address',
  connected_wallet: 'connected_wallet',  // EOA wallet address
  chain_id: 'chain_id',
  chain_name: 'chain_name',
  
  // Safe-specific (only when in Safe context)
  safe_address: 'safe_address',
  safe_version: 'safe_version',
  safe_threshold: 'safe_threshold',
  safe_owners_count: 'safe_owners_count',
  is_safe_owner: 'is_safe_owner',
  
  // App context
  current_route: 'current_route',
  page_section: 'page_section',
  app_theme: 'app_theme',
  app_currency: 'app_currency',
  
  // Safe app context
  safe_app_url: 'safe_app_url',
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
  const settings = useAppSelector(selectSettings)
  const [userEmail, setUserEmail] = useLocalStorage<string>(PYLON_EMAIL_KEY)
  const currentChain = useCurrentChain()
  const router = useRouter()
  
  // Compute user context
  const userContext = useMemo(() => {
    const isSafeContext = !!safeAddress && !!safe
    const primaryAddress = isSafeContext ? safeAddress : wallet?.address || ''
    const shortAddress = formatAddress(primaryAddress)
    const email = userEmail || `user-${primaryAddress.toLowerCase()}@safewallet.com`
    const contactName = isSafeContext ? `Safe ${shortAddress}` : `Wallet ${shortAddress}`
    
    return {
      isSafeContext,
      primaryAddress,
      shortAddress,
      email,
      contactName,
      isValid: validateAddress(primaryAddress)
    }
  }, [safeAddress, safe, wallet?.address, userEmail])

  // Build custom fields for the current context
  const buildCustomFields = useCallback(() => {
    const fields: Record<string, any> = {}
    
    // Basic context
    fields[FIELD_MAPPINGS.account_type] = userContext.isSafeContext ? 'safe' : 'eoa'
    fields[FIELD_MAPPINGS.primary_address] = userContext.primaryAddress
    fields[FIELD_MAPPINGS.chain_id] = chainId
    fields[FIELD_MAPPINGS.chain_name] = currentChain?.chainName || 'Unknown'
    
    // Always include connected wallet (EOA) if available
    if (wallet?.address) {
      fields[FIELD_MAPPINGS.connected_wallet] = wallet.address
    }
    
    // User preferences
    fields[FIELD_MAPPINGS.app_theme] = settings.theme.darkMode ? 'dark' : 'light'
    fields[FIELD_MAPPINGS.app_currency] = settings.currency
    
    // Safe-specific fields
    if (userContext.isSafeContext && safe) {
      fields[FIELD_MAPPINGS.safe_address] = safeAddress
      fields[FIELD_MAPPINGS.safe_version] = safe.version
      fields[FIELD_MAPPINGS.safe_threshold] = `${safe.threshold}/${safe.owners.length}`
      fields[FIELD_MAPPINGS.safe_owners_count] = safe.owners.length
      fields[FIELD_MAPPINGS.is_safe_owner] = safe.owners.some(owner => owner.value === wallet?.address)
    }
    
    // Page context
    const pageSection = router.pathname.split('/')[1] || 'home'
    fields[FIELD_MAPPINGS.current_route] = router.pathname
    fields[FIELD_MAPPINGS.page_section] = pageSection
    
    // Safe app context
    const safeAppUrl = router.query.appUrl?.toString()
    if (safeAppUrl) {
      fields[FIELD_MAPPINGS.safe_app_url] = safeAppUrl
      try {
        fields[FIELD_MAPPINGS.safe_app_name] = new URL(safeAppUrl).hostname
      } catch {
        fields[FIELD_MAPPINGS.safe_app_name] = 'Unknown Safe App'
      }
    }
    
    return fields
  }, [userContext, chainId, currentChain, settings, safe, safeAddress, wallet?.address, router])

  // Update Pylon when context changes
  useEffect(() => {
    if (!userContext.isValid) return
    
    // Wait for Pylon to load (max 10 seconds)
    let checkCount = 0
    const maxChecks = 100
    
    const tryUpdate = () => {
      if (!window.Pylon) {
        if (checkCount++ < maxChecks) {
          setTimeout(tryUpdate, 100)
        }
        return
      }
      
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
        
        // Set custom fields for new issues
        const customFields = buildCustomFields()
        window.Pylon('setNewIssueCustomFields', customFields)
      } catch (error) {
        console.error('[Pylon] Failed to update:', error)
      }
    }
    
    tryUpdate()
  }, [userContext, chainId, buildCustomFields])
  
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
    window.Pylon?.('setNewIssueCustomFields', fields)
  },
  
  // Refresh user context
  refresh: () => window.Pylon?.('update'),
}

// Make helpers available in console for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).pylonHelpers = pylonHelpers
}