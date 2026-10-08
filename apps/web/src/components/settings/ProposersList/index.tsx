import CheckWallet from '@/components/common/CheckWallet'
import SafeProLock from '@/components/common/SafeProLock'
import {
  AddProposer,
  DeleteProposerDialog,
  EditProposerDialog,
  PendingDelegationsList,
  useMigrateProposerLabels,
  useParentSafeThreshold,
} from '@/features/proposers'
import { usePlanGate } from '@/features/spaces'
import { useHasFeature } from '@/hooks/useChains'
import useProposers from '@/hooks/useProposers'
import { useIsNestedSafeOwner } from '@/hooks/useIsNestedSafeOwner'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import { UpgradeFeature } from '@/services/analytics'
import EthHashInfo from '@/components/common/EthHashInfo'
import { useMemo, useState } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import NamedAddressInfo from '@/components/common/NamedAddressInfo'
import { ProposersListView } from '@views/components/settings/ProposersList/ProposersListView'

const ProposersList = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>()
  const proposers = useProposers()
  const isEnabled = useHasFeature(FEATURES.PROPOSERS)
  const { mustUpgradeToSafePro, isLoading: isPlanLoading, upgradeHref } = usePlanGate(FEATURES.PROPOSER_GATING)
  useMigrateProposerLabels()
  const { safe } = useSafeInfo()
  const isUndeployedSafe = !safe.deployed
  const isNestedSafeOwner = useIsNestedSafeOwner()
  const nestedSafeOwners = useNestedSafeOwners()
  const { threshold: parentThreshold } = useParentSafeThreshold(nestedSafeOwners?.[0])
  const showPendingDelegations = isNestedSafeOwner && parentThreshold !== undefined && parentThreshold > 1

  const items = useMemo(() => {
    if (!proposers.data) return []

    return proposers.data.results.map((proposer) => ({
      delegate: proposer.delegate,
      delegator: proposer.delegator,
      proposer: <NamedAddressInfo address={proposer.delegate} showCopyButton hasExplorer shortAddress />,
      creator: <EthHashInfo address={proposer.delegator} showCopyButton hasExplorer shortAddress />,
      actions: (
        <>
          <EditProposerDialog proposer={proposer} />
          <DeleteProposerDialog proposer={proposer} />
        </>
      ),
    }))
  }, [proposers.data])

  if (!proposers.data?.results) return null

  const onAdd = () => {
    setIsAddDialogOpen(true)
  }

  return (
    <ProposersListView
      items={items}
      isEnabled={!!isEnabled}
      mustUpgradeToSafePro={mustUpgradeToSafePro}
      isPlanLoading={isPlanLoading}
      isUndeployedSafe={isUndeployedSafe}
      showPendingDelegations={showPendingDelegations}
      pendingDelegations={<PendingDelegationsList />}
      renderSafeProLock={({ title }) => (
        <SafeProLock title={title} href={upgradeHref} feature={UpgradeFeature.PROPOSERS} />
      )}
      renderCheckWallet={(render) => <CheckWallet allowProposer={false}>{render}</CheckWallet>}
      onAdd={onAdd}
      addDialog={
        isAddDialogOpen && (
          <AddProposer onClose={() => setIsAddDialogOpen(false)} onSuccess={() => setIsAddDialogOpen(false)} />
        )
      }
    />
  )
}

export default ProposersList
