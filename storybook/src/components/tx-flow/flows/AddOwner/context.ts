import { type Context, createContext } from 'react'
import { type AddOwnerFlowProps } from '@/components/tx-flow/flows/AddOwner'
import { type ReplaceOwnerFlowProps } from '@/components/tx-flow/flows/ReplaceOwner'

type SettingsChange = Context<AddOwnerFlowProps | ReplaceOwnerFlowProps>

export const SettingsChangeContext: SettingsChange = createContext({} as AddOwnerFlowProps | ReplaceOwnerFlowProps)
