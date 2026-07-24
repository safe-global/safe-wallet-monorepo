import { Fragment, useContext, useMemo } from 'react'
import { useRouter } from 'next/router'
import { Button, Chip, Paper, Stack, Tooltip, Typography } from '@mui/material'
import type { Address } from 'viem'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { ChainLogo, SafeIdenticon } from '@/components/common/SpaceSafeBar/AccountsModal/shared'
import useChains from '@/hooks/useChains'
import { useSpaceSafes } from '@/features/spaces'
import { useAddressBookItem } from '@/hooks/useAllAddressBooks'
import { TxModalContext } from '@/components/tx-flow'
import PolicyBatchFlow from '@/components/tx-flow/flows/PolicyBatch'
import { flattenSafes, safeRefKey, type SafeRef } from './safeRefs'
import { usePolicyRequests, type PolicyRequest } from './policyRequestStore'
import { encodeApplyConfiguration } from './shared/guardTx'

const guardOf = (request: PolicyRequest): string | undefined =>
  request.enforcement.via === 'guard' ? request.enforcement.guards.transactionGuard?.safePolicyGuard : undefined

const summarize = (request: PolicyRequest): string => {
  const recipients = request.data.allowlist.reduce((n, entry) => n + entry.recipients.length, 0)
  return `${request.data.allowlist.length} token(s) · ${recipients} recipient(s)`
}

const RequestRow = ({ request, onApply }: { request: PolicyRequest; onApply: (request: PolicyRequest) => void }) => {
  const nowSec = Math.floor(Date.now() / 1000)
  const isReady = nowSec >= request.readyAt
  const hoursLeft = Math.max(0, Math.ceil((request.readyAt - nowSec) / 3600))

  return (
    <Stack gap={1} sx={{ py: 1.5, borderTop: '1px solid rgba(0, 0, 0, 0.04)' }}>
      <Stack direction="row" alignItems="center" gap={1.5}>
        <Typography
          sx={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: 'warning.main',
            minWidth: 150,
          }}
        >
          Token withdraw allowlist
        </Typography>
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{summarize(request)}</Typography>
      </Stack>

      <Stack direction="row" alignItems="center" gap={1} justifyContent="space-between">
        <Tooltip title={request.configureRoot}>
          <Typography
            sx={{ fontSize: 12, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', cursor: 'default' }}
          >
            Root {shortenAddress(request.configureRoot)}
          </Typography>
        </Tooltip>

        <Stack direction="row" alignItems="center" gap={1}>
          {isReady ? (
            <Chip size="small" color="success" variant="outlined" label="Ready to apply" />
          ) : (
            <Chip size="small" variant="outlined" label={`Ready in ~${hoursLeft}h`} />
          )}
          <Button size="small" variant="contained" disabled={!isReady} onClick={() => onApply(request)}>
            Apply
          </Button>
        </Stack>
      </Stack>
    </Stack>
  )
}

const SafePendingPolicies = ({ safe }: { safe: SafeRef }) => {
  const router = useRouter()
  const { configs: chains } = useChains()
  const { setTxFlow } = useContext(TxModalContext)
  const contact = useAddressBookItem(safe.address, safe.chainId)
  const { requests, remove } = usePolicyRequests(safe.chainId, safe.address)

  if (requests.length === 0) return null

  const name = contact?.name || safe.name

  const onApply = async (request: PolicyRequest) => {
    const guard = guardOf(request)
    if (!guard) return

    const tx = encodeApplyConfiguration(guard as Address, request.configurations)

    // Point the app at this Safe so the tx-flow SDK/useSafeInfo resolve it, then
    // hand off the applyConfiguration tx. On success, drop the pending record.
    const chain = chains.find((c) => c.chainId === safe.chainId)
    if (chain) {
      await router.replace(
        { pathname: router.pathname, query: { ...router.query, safe: `${chain.shortName}:${safe.address}` } },
        undefined,
        { shallow: true },
      )
    }

    setTxFlow(
      <PolicyBatchFlow
        txs={[tx]}
        subtitle="Apply token withdraw change"
        onSubmit={(args) => {
          if (args?.txId) remove(request.id)
        }}
      />,
    )
  }

  return (
    <Paper elevation={0} sx={{ p: 2, borderRadius: '16px', border: '1px solid rgba(0, 0, 0, 0.04)' }}>
      <Stack direction="row" alignItems="center" gap={1} mb={0.5}>
        <SafeIdenticon address={safe.address} size={20} />
        {name && <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{name}</Typography>}
        <Typography sx={{ fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums' }}>
          {shortenAddress(safe.address)}
        </Typography>
        <ChainLogo chainId={safe.chainId} size={16} />
      </Stack>

      {requests.map((request) => (
        <RequestRow key={request.id} request={request} onApply={onApply} />
      ))}
    </Paper>
  )
}

/**
 * Pending policy changes across the space's Safes — requested on-chain but not
 * yet applied (waiting out the SafePolicyGuard delay). Backed by local storage
 * (savePolicyRequestApi) until the real CGW pending endpoint lands. Each row
 * shows the config root + policy info and an Apply button that builds the
 * applyConfiguration Safe transaction once the delay has elapsed.
 */
const PendingPoliciesList = () => {
  const { allSafes } = useSpaceSafes()
  const flatSafes = useMemo(() => flattenSafes(allSafes), [allSafes])

  if (flatSafes.length === 0) return null

  return (
    <Stack gap={1.5} sx={{ maxWidth: 1040, mb: 4 }}>
      <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.4px', textTransform: 'uppercase' }}>
        Pending policies
      </Typography>
      {flatSafes.map((safe) => (
        <Fragment key={safeRefKey(safe)}>
          <SafePendingPolicies safe={safe} />
        </Fragment>
      ))}
    </Stack>
  )
}

export default PendingPoliciesList
