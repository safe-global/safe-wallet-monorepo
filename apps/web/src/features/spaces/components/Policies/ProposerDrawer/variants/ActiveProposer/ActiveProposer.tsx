import type { ReactElement } from 'react'
import { ProposerOverview } from '../../components/ProposerOverview'
import type { ActiveProposerProps } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/variants/types'

export type { ActiveProposerProps } from '@safe-global/views/features/spaces/components/Policies/ProposerDrawer/variants/types'

export const ActiveProposer = ({ overview }: ActiveProposerProps): ReactElement => <ProposerOverview {...overview} />
