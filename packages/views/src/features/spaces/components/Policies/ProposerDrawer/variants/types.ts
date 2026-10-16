import type { ReactNode } from 'react'
import type { ProposerOverviewProps } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/components/ProposerOverview/types'
import type { SignatureSafeInfo } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/components/SafeSignatureInfo/types'

export type ActiveProposerProps = {
  overview: ProposerOverviewProps
}

export type NotActivatedProposerProps = {
  description: ReactNode
  safe: SignatureSafeInfo
  signatures: number
  expiresLabel?: string
  overview: ProposerOverviewProps
}

export type PendingProposerProps = {
  description: ReactNode
  safe: SignatureSafeInfo
  signatures: number
  expiresLabel?: string
  overview: ProposerOverviewProps
}

export enum ProposerStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  NOT_ACTIVATED = 'NOT_ACTIVATED',
}

export type ProposerVariantContentProps =
  | ({ status: ProposerStatus.ACTIVE } & ActiveProposerProps)
  | ({ status: ProposerStatus.PENDING } & PendingProposerProps)
  | ({ status: ProposerStatus.NOT_ACTIVATED } & NotActivatedProposerProps)
