import { type Context, createContext } from 'react'
import type {
  AddOwnerFlowProps,
  ReplaceOwnerFlowProps,
} from '@safe-global/design/components/tx-flow/flows/AddOwner/types'

type SettingsChange = Context<AddOwnerFlowProps | ReplaceOwnerFlowProps>

export const SettingsChangeContext: SettingsChange = createContext({} as AddOwnerFlowProps | ReplaceOwnerFlowProps)
