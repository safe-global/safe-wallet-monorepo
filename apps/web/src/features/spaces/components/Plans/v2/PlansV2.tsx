import type { ComponentProps } from 'react'
import type Plans from '../index'
import PlanStatusCard from '../PlanStatusCard'
import PlanCatalogV2 from './PlanCatalogV2'

/** The Plans page behind SAFE_PRO_PLANS_V2: the same status panel over the v2 plan cards. */
export default function PlansV2({
  plan,
  safeAccounts,
  sponsoredTxs,
  tiers,
  onManage,
  isManaging,
  canManage,
  onSubscribe,
  isSubscribing,
  currentPlan,
  readOnly,
}: ComponentProps<typeof Plans>) {
  return (
    <div className="flex flex-col gap-6">
      <PlanStatusCard
        plan={plan}
        safeAccounts={safeAccounts}
        sponsoredTxs={sponsoredTxs}
        tierName={plan?.name}
        onManage={onManage}
        isManaging={isManaging}
        canManage={readOnly ? false : canManage}
        appearance="v2"
      />
      <PlanCatalogV2
        tiers={tiers}
        currentPlan={currentPlan}
        onSubscribe={onSubscribe}
        onManage={onManage}
        isBusy={isSubscribing || isManaging}
        readOnly={readOnly}
      />
    </div>
  )
}
