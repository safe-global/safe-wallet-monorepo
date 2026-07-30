import { Stack, Typography } from '@mui/material'
import { useRouter } from 'next/router'
import PoliciesBySafe from './PoliciesBySafe'
import SpendingLimitFlow from './SpendingLimitFlow'
import RecoveryFlow from './RecoveryFlow'
import ERC20TransferPolicyFlow from './ERC20TransferPolicy'
import CosignerPolicyFlow from './CosignerPolicy'

/**
 * The space's policies, led by the Safe they apply to.
 *
 * Policies are enforced per Safe and CGW reports them per Safe, so the page lists the
 * space's Safes and nests each Safe's policy types under it — add, inspect and apply
 * all happen in the Safe's own section. `?policy=` switches to a builder wizard, which
 * receives the chosen Safe via `?policySafe=` so it doesn't ask for it again.
 */
const SpacePolicies = () => {
  const router = useRouter()

  if (router.query.policy === 'spendingLimit') {
    return <SpendingLimitFlow />
  }

  if (router.query.policy === 'accountRecovery') {
    return <RecoveryFlow />
  }

  if (router.query.policy === 'tokenWithdraw') {
    return <ERC20TransferPolicyFlow />
  }

  if (router.query.policy === 'cosigner') {
    return <CosignerPolicyFlow />
  }

  return (
    <>
      <Stack mb={5} gap={1}>
        <Typography variant="h1">Policies</Typography>
        <Typography sx={{ fontSize: 15, color: 'text.secondary' }}>
          Rules that govern this workspace&apos;s Safes — applied onchain, enforced by audited modules and guards.
        </Typography>
      </Stack>

      <PoliciesBySafe />
    </>
  )
}

export default SpacePolicies
