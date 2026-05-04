import type { ComponentType } from 'react'

export interface ActionsTrayContract {
  ActionsTray: ComponentType<{ noAssets: boolean; variant?: 'safe' | 'space' }>
}
