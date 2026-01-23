import { type Context, createContext } from 'react'
import { type AddOwnerFlowProps } from '.'
import { type ReplaceOwnerFlowProps } from '../ReplaceOwner'

type SettingsChange = Context<AddOwnerFlowProps | ReplaceOwnerFlowProps>

export const SettingsChangeContext: SettingsChange = createContext({} as AddOwnerFlowProps | ReplaceOwnerFlowProps)
