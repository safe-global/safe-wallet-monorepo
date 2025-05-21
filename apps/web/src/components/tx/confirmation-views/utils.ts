import type { ChangeThreshold, SettingsChange, TransactionInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { SettingsInfoType, TransactionInfoType } from '@safe-global/safe-gateway-typescript-sdk'
import { ConfirmBatchFlow } from '@/components/tx-flow/flows'
import { type ReactElement } from 'react'

export const isSettingsChangeView = (txInfo: TransactionInfo): txInfo is SettingsChange =>
  txInfo.type === TransactionInfoType.SETTINGS_CHANGE &&
  txInfo.settingsInfo?.type !== SettingsInfoType.SET_FALLBACK_HANDLER

export const isConfirmBatchView = (txFlow?: ReactElement) => txFlow?.type === ConfirmBatchFlow

export const isChangeThresholdView = (
  txInfo: TransactionInfo,
): txInfo is SettingsChange & { settingsInfo: ChangeThreshold } =>
  txInfo.type === TransactionInfoType.SETTINGS_CHANGE && txInfo.settingsInfo?.type === SettingsInfoType.CHANGE_THRESHOLD
