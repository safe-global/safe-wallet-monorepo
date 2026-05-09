declare module '*.svg' {
  import React from 'react'
  const content: string
  export default content
  export const ReactComponent: React.FunctionComponent<React.SVGAttributes<SVGElement> & { title?: string }>
}

declare module '*.svg?react' {
  import React from 'react'
  const ReactComponent: React.FunctionComponent<React.SVGAttributes<SVGElement> & { title?: string }>
  export default ReactComponent
}

declare module 'ethereum-blockies-base64' {
  function makeBlockie(address: string): string
  export default makeBlockie
}

declare module 'react-media' {
  import { ComponentType } from 'react'
  interface MediaProps {
    query: string | Record<string, unknown>
    render?: () => React.ReactNode
    children?: (matches: boolean) => React.ReactNode
  }
  const Media: ComponentType<MediaProps>
  export default Media
}

declare module '@gnosis.pm/safe-react-components' {
  export interface EllipsisMenuItem {
    label: string
    onClick: () => void
    disabled?: boolean
  }
}

declare module '@gnosis.pm/safe-react-components/dist/inputs/Select' {
  export interface SelectItem {
    id: string
    label: string
    iconUrl?: string
    subLabel?: string
  }
}

// MUI v6 - BreakpointDefaults is no longer exported, define locally
declare module '@mui/material/styles/createBreakpoints' {
  export interface BreakpointDefaults {
    xs: true
    sm: true
    md: true
    lg: true
    xl: true
  }
}
