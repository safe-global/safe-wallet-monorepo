import type React from 'react'
import type { BeamerConfig, BeamerMethods } from '@services/beamer/types'

declare global {
  interface Window {
    isDesktop?: boolean
    ethereum?: {
      autoRefreshOnNetworkChange: boolean
      isMetaMask: boolean
      _metamask: {
        isUnlocked: () => Promise<boolean>
      }
      isConnected?: () => boolean
    }
    beamer_config?: BeamerConfig
    Beamer?: BeamerMethods
    dataLayer?: any[]
    gtag?: (...args: any[]) => void
    Cypress?
    hbspt?: {
      forms: {
        create: (options: {
          portalId: string
          formId: string
          region: string
          target?: string
          onFormReady?: (form: any) => void
          onFormSubmit?: (form: any) => boolean
        }) => void
      }
    }
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void
    }
  }
}

declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    danger: true
  }
}

declare module '*.svg' {
  const content: any
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default content
}

export {}
