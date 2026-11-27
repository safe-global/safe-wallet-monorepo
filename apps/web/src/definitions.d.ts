import type React from 'react'

declare global {
  interface Window {
    isDesktop?: boolean
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
          inlineMessage?: string
          redirectUrl?: string
          onFormReady?: (form: any) => void
          onFormSubmit?: (form: any) => boolean
          onFormSubmitted?: (form: any, data: any) => void
        }) => void
      }
    }
    Calendly?: {
      initInlineWidget: (options: { url: string; parentElement: HTMLElement }) => void
    }
  }
}

declare module '*.svg' {
  const content: any
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default content
}

export {}
